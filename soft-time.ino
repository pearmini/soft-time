#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <string>
#include <vector>
#include <sstream>

// Pin definitions for Teensy 4.0
#define DEV_CS_PIN 10
#define DEV_RST_PIN 8
#define DEV_DC_PIN 9
#define DEV_BL_PIN 3  // optional: use a PWM pin for dimming backlight

Adafruit_ST7789 tft = Adafruit_ST7789(DEV_CS_PIN, DEV_DC_PIN, DEV_RST_PIN);

const int width = 240;
const int height = 280;
uint16_t myBitmap[width * height] = { 0 };

std::vector<uint16_t> parseColors(const std::string& specifier) {
  int n = specifier.length() / 6;
  std::vector<uint16_t> colors;
  colors.reserve(n);

  for (int i = 0; i < n; ++i) {
    std::string chunk = specifier.substr(i * 6, 6);

    int r = std::stoi(chunk.substr(0, 2), nullptr, 16);
    int g = std::stoi(chunk.substr(2, 2), nullptr, 16);
    int b = std::stoi(chunk.substr(4, 2), nullptr, 16);

    uint16_t color = ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
    colors.push_back(color);
  }

  return colors;
}

uint16_t interpolateColorRGB565(uint16_t c1, uint16_t c2, float t) {
  t = std::fmax(0.0f, std::fmin(1.0f, t));

  uint8_t r1 = (c1 >> 11) & 0x1F;
  uint8_t g1 = (c1 >> 5) & 0x3F;
  uint8_t b1 = c1 & 0x1F;

  uint8_t r2 = (c2 >> 11) & 0x1F;
  uint8_t g2 = (c2 >> 5) & 0x3F;
  uint8_t b2 = c2 & 0x1F;

  uint8_t r = static_cast<uint8_t>(r1 + (r2 - r1) * t);
  uint8_t g = static_cast<uint8_t>(g1 + (g2 - g1) * t);
  uint8_t b = static_cast<uint8_t>(b1 + (b2 - b1) * t);

  return (r << 11) | (g << 5) | b;
}

std::vector<uint16_t> viridis = parseColors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725");

std::vector<uint16_t> inferno = parseColors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4");

uint16_t interpolate(float t, std::vector<uint16_t> colors) {
  int n = colors.size();
  int i = std::max(0, std::min(n - 1, static_cast<int>(std::floor(t * n))));
  return colors[i];
}



void setup() {
  Serial.begin(115200);
  Serial.println("Initializing Waveshare 1.69\" LCD on Teensy...");

  // --- GPIO Init ---
  pinMode(DEV_CS_PIN, OUTPUT);
  pinMode(DEV_RST_PIN, OUTPUT);
  pinMode(DEV_DC_PIN, OUTPUT);
  pinMode(DEV_BL_PIN, OUTPUT);
  analogWrite(DEV_BL_PIN, 180);  // backlight brightness (0–255)

  // --- SPI Init ---
  SPI.begin();
  SPI.beginTransaction(SPISettings(8000000, MSBFIRST, SPI_MODE3));

  // --- Display Init ---
  tft.init(width, height, SPI_MODE3);  // ST7789V2 often needs mode 3
  tft.fillScreen(ST77XX_BLACK);
}

float offset = 0;
float flag = 1;

void loop() {
  for (int i = 0; i < height; i++) {
    for (int j = 0; j < width; j++) {
      int index = j + i * width;
      float t = float(i) / float(height);
      uint16_t sc = interpolate(t, viridis);
      uint16_t tc = interpolate(1 - t, inferno);
      uint16_t c = interpolateColorRGB565(sc, tc, offset);
      myBitmap[index] = c;
    }
  }
  tft.drawRGBBitmap(0, 0, myBitmap, width, height);
  offset += flag * 0.01;
  if (offset >= 1.05) {
    flag = -1;
  }
  if (offset <= -0.05) {
    flag = 1;
  }
}