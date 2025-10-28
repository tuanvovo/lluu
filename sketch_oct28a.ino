#define BLYNK_TEMPLATE_ID "TMPL6ITyq02wD"
#define BLYNK_TEMPLATE_NAME "Aptomat"
#define BLYNK_AUTH_TOKEN "rum78doJsOjCNQ6heXtKLS1WonPOhcH_"

#define BLYNK_PRINT Serial
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <Servo.h>

// -----------------------------------------------------------------
// CAU HINH PHAN CUNG & GOC DO
// -----------------------------------------------------------------
#define SERVO_PIN       5    // D1 (GPIO5)
#define CB_STATE_PIN    4    // D2 (GPIO4) - Doc trang thai CB (Feedback)
#define VIRTUAL_PIN_STATUS V3 // Chan ao hien thi trang thai CB thuc te

#define G_NGHI          120  
#define G_ON            0    
#define G_OFF           180  
#define THOI_GIAN_GAT   500  

Servo myservo;
BlynkTimer timer;

// Thong tin Ket noi WiFi
char ssid[] = "Ha494A";         
char pass[] = "Danang-Hoian:30"; 

// Trang thai CB
int current_cb_status = 0; // 0: OFF, 1: ON

// Ham kiem tra trang thai CB thuc te (Feedback)
void checkCBStatus() {
    int physical_state = digitalRead(CB_STATE_PIN);
    int blynk_status;

    if (physical_state == HIGH) {
        // Neu D2 la HIGH -> CB TAT
        blynk_status = 0; 
    } else {
        // Neu D2 la LOW -> CB BAT
        blynk_status = 1; 
    }

    if (blynk_status != current_cb_status) {
        current_cb_status = blynk_status;
        // Gui trang thai thuc te len Blynk V3
        Blynk.virtualWrite(VIRTUAL_PIN_STATUS, blynk_status);
        Serial.print("CB_STATUS: ");
        Serial.print(current_cb_status == 1 ? "BAT" : "TAT");
        Serial.print(" -> Gui len V3: ");
        Serial.println(blynk_status);
    }
}

// Ham xu ly lenh dieu khien tu Blynk (Web App gui len V1)
BLYNK_WRITE(V1) {
    int command = param.asInt();
    
    if (command == 1) {
        // Lenh BAT (ON)
        Serial.println("Lenh BAT (ON) duoc thuc thi.");
        myservo.write(G_ON); 
        delay(THOI_GIAN_GAT);
        myservo.write(G_NGHI); 
    } else if (command == 0) {
        // Lenh TAT (OFF)
        Serial.println("Lenh TAT (OFF) duoc thuc thi.");
        myservo.write(G_OFF); 
        delay(THOI_GIAN_GAT);
        myservo.write(G_NGHI); 
    }
}

void setup() {
    Serial.begin(115200);

    // Thiet lap cac chan GPIO
    pinMode(CB_STATE_PIN, INPUT_PULLUP);
    myservo.attach(SERVO_PIN);
    
    // 1. BUOC SERVO GAT TAT DE DAM BAO NGAT DIEN KHI KHOI DONG LAI
    myservo.write(G_OFF); 
    delay(1000); 

    // 2. VE VI TRI NGHI (120 do)
    myservo.write(G_NGHI);
    
    // 3. Dat trang thai ban dau la TAT (OFF)
    current_cb_status = 0;

    // Khoi tao Blynk va WiFi
    Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

    // Khoi tao timer de kiem tra trang thai CB (V3) moi 5 giay
    timer.setInterval(5000L, checkCBStatus);

    // Dong bo nut V1 tren Blynk ve 0 (OFF) khi khoi dong lai
    Blynk.virtualWrite(V1, 0); 
}

void loop() {
    Blynk.run();
    timer.run();
}