from paho.mqtt import client as mqtt_client
from app.services.stats_service import stats
from app.services.db_service import insert_history
import os
import requests
import time
import threading

insert_thread_started = False

USER = os.getenv("AIO_USERNAME")
KEY = os.getenv("AIO_KEY")
GROUP_NAME = "yolohome"

mqtt = None


def realtime_insert_loop():
    while True:
        try:
            temp = stats.get("temp")
            humi = stats.get("humi")
            light = stats.get("light", 0)

            if temp is not None and humi is not None:
                insert_history(temp, humi, light)
                print("[REALTIME INSERT]", temp, humi, light)
            else:
                print("[SKIP INSERT] temp/humi chưa có:", temp, humi)

        except Exception as e:
            print("[REALTIME INSERT ERROR]", e)

        time.sleep(1)


def sync_latest_from_adafruit():
    if not USER or not KEY:
        print("[AIO ERROR] Missing AIO_USERNAME or AIO_KEY")
        return

    headers = {
        "X-AIO-Key": KEY
    }

    for key in stats:
        feed_key = f"{GROUP_NAME}.{key}"
        url = f"https://io.adafruit.com/api/v2/{USER}/feeds/{feed_key}/data/last"

        try:
            res = requests.get(url, headers=headers, timeout=5)

            if res.status_code != 200:
                print(f"[AIO SYNC SKIP] {feed_key}: {res.status_code}")
                continue

            data = res.json()
            value = data.get("value")

            if value is None:
                continue

            try:
                stats[key] = float(str(value).split(",")[0])
            except:
                stats[key] = value

            print(f"[AIO SYNC] {key} = {stats[key]}")

        except Exception as e:
            print(f"[AIO SYNC ERROR] {key}: {e}")


def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode().strip()

    print("MQTT RECEIVED:", topic, payload)

    try:
        value = float(str(payload).split(",")[0])
    except:
        value = payload

    if topic.endswith(".temp"):
        stats["temp"] = value
    elif topic.endswith(".humi"):
        stats["humi"] = value
    elif topic.endswith(".light"):
        stats["light"] = value
    elif topic.endswith(".pir"):
        stats["pir"] = value
    elif topic.endswith(".led"):
        stats["led"] = value
    elif topic.endswith(".fan"):
        stats["fan"] = value
    elif topic.endswith(".servo"):
        stats["servo"] = value


def on_connect(client, userdata, flags, reason_code, properties):
    print("MQTT connected with code:", reason_code)

    for key in stats:
        client.subscribe(f"{USER}/feeds/{GROUP_NAME}.{key}")
        print(f"[SUBSCRIBE] {USER}/feeds/{GROUP_NAME}.{key}")


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    print("MQTT disconnected:", reason_code)


def init_mqtt():
    global mqtt, insert_thread_started

    sync_latest_from_adafruit()

    mqtt = mqtt_client.Client(
        callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2
    )

    mqtt.username_pw_set(USER, KEY)
    mqtt.on_connect = on_connect
    mqtt.on_disconnect = on_disconnect
    mqtt.on_message = on_message

    mqtt.connect("io.adafruit.com", 1883, 60)
    mqtt.loop_start()

    if not insert_thread_started:
        t = threading.Thread(target=realtime_insert_loop, daemon=True)
        t.start()
        insert_thread_started = True
        print("[INSERT THREAD STARTED]")

    print("MQTT starting...")


def publish(device, val):
    global mqtt

    if mqtt is None:
        print("[MQTT ERROR] mqtt is None")
        return False

    if not mqtt.is_connected():
        print("[MQTT ERROR] MQTT chưa connected, đang reconnect...")
        try:
            mqtt.reconnect()
            mqtt.loop_start()
        except Exception as e:
            print("[MQTT ERROR] Reconnect failed:", e)
            return False

    topic = f"{USER}/feeds/{GROUP_NAME}.{device}"
    result = mqtt.publish(topic, str(val))

    result.wait_for_publish()

    if result.rc != mqtt_client.MQTT_ERR_SUCCESS:
        print(f"[MQTT ERROR] Publish failed rc={result.rc}")
        return False

    print(f"[PUBLISH OK] {val} -> {topic}")
    return True