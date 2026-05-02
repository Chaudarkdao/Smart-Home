from paho.mqtt import client as mqtt_client
from app.services.stats_service import stats
from app.services.db_service import insert_history
import json
import os

USER = os.getenv("AIO_USERNAME")
KEY = os.getenv("AIO_KEY")
GROUP_NAME = "yolohome" 

mqtt = None
mqtt = None

last_temp = None
last_humi = None
def on_message(client, userdata, msg):
    global last_temp, last_humi

    try:
        topic_tail = msg.topic.split('/')[-1]
        topic_path = topic_tail.split('.')[-1].lower()
        payload = msg.payload.decode().strip()

        if payload.startswith('{'):
            payload = json.loads(payload).get("value", "0")

        payload = str(payload).split(',')[0]

        if topic_path == "dist":
            topic_path = "pir"

        if topic_path not in stats:
            return

        val = float(payload)
        stats[topic_path] = val

        print(f"MQTT Inbox: {topic_path} -> {val}")

        # Chỉ lưu history khi là temp hoặc humi
        if topic_path == "temp":
            last_temp = val
        elif topic_path == "humi":
            last_humi = val
        else:
            return

        if last_temp is not None and last_humi is not None:
            insert_history(last_temp, last_humi)
            last_temp = None
            last_humi = None

    except Exception as e:
        print(f"Error processing message: {e}")



def on_connect(client, userdata, flags, reason_code, properties):
    print("MQTT connected with code:", reason_code)

    for key in stats:
        client.subscribe(f"{USER}/feeds/{GROUP_NAME}.{key}")
        print(f"[SUBSCRIBE] {USER}/feeds/{GROUP_NAME}.{key}")


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    print("MQTT disconnected:", reason_code)


def init_mqtt():
    global mqtt

    mqtt = mqtt_client.Client(
        callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2
    )

    mqtt.username_pw_set(USER, KEY)
    mqtt.on_connect = on_connect
    mqtt.on_disconnect = on_disconnect
    mqtt.on_message = on_message

    mqtt.connect("io.adafruit.com", 1883, 60)
    mqtt.loop_start()

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