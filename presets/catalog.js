// Создан tools/update-presets.js из файлов папки presets.
globalThis.ELECTROSIM_PRESET_CATALOG = [
  {
    "file": "Бытовой монтаж — комнаты.ad-scheme.json",
    "modified": 1792248792784.4878,
    "data": {
      "format": "ad-trainer-scheme",
      "version": 1,
      "exported": "2026-10-14T16:13:55.824Z",
      "preset": {
        "version": 3,
        "id": "stand-household-rooms",
        "name": "Бытовой монтаж — комнаты",
        "updated": 1791994973988,
        "state": {
          "power": true,
          "devices": [],
          "relays": [],
          "wires": [],
          "nextId": 1,
          "motors": [],
          "pushbuttons": [],
          "panels": [
            {
              "id": "PN1",
              "tag": "ЩР1",
              "railCount": 3,
              "x": 670,
              "y": 820,
              "inbox": true,
              "inletVoltage": 220,
              "fixed": true
            }
          ],
          "standaloneRails": false,
          "workbench": null,
          "clamps": [],
          "specialProps": {
            "inbox": {
              "tag": "XT1",
              "customName": "Ввод 220 В",
              "ratedVoltage": 220,
              "frequency": 50
            },
            "multimeter": {
              "tag": "PV1",
              "customName": "Цифровой мультиметр"
            }
          },
          "special": {
            "inbox": true,
            "pushbutton": false,
            "motor": false,
            "multimeter": false
          },
          "roomScene": "household"
        },
        "positions": {
          "inbox": {
            "x": 50,
            "y": -140
          },
          "pushbutton": {
            "x": 930,
            "y": 720
          },
          "motor": {
            "x": 463,
            "y": 875,
            "load": 0
          },
          "multimeter": {
            "x": 875,
            "y": 1080,
            "redX": 1051,
            "redY": 1034,
            "blackX": 935,
            "blackY": 1034,
            "fn": "voltage",
            "power": true,
            "aDocked": true,
            "bDocked": true,
            "a": null,
            "b": null
          }
        },
        "journal": {
          "items": [],
          "faultCount": 0,
          "filter": "work"
        }
      }
    }
  },
  {
    "file": "Монтаж квартирного щита.ad-scheme.json",
    "modified": 1792271423143.4785,
    "data": {
      "format": "ad-trainer-scheme",
      "version": 1,
      "exported": "2026-10-17T21:10:18.131Z",
      "preset": {
        "version": 3,
        "id": "scheme-mvcw4kya",
        "name": "Монтаж квартирного щита",
        "updated": 1792271418130,
        "state": {
          "power": true,
          "devices": [
            {
              "id": 1,
              "type": "mcb2",
              "rail": "PN1:0",
              "slot": 4,
              "on": true,
              "tripped": false,
              "tag": "QF1",
              "breakerType": "C63",
              "ratedCurrent": 63,
              "ratedVoltage": 220,
              "customName": "Автомат 2P, C63",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 59.99999999999916,
              "breakerPhaseCurrents": [
                59.99999999999916,
                59.99999999999495
              ]
            },
            {
              "id": 2,
              "type": "meter",
              "rail": "PN1:0",
              "slot": 0,
              "on": false,
              "tripped": false,
              "tag": "PI1",
              "coil": false,
              "energyKwh": 19.670250491665097,
              "meterPowerW": 13199.999999999805,
              "meterPulse": true
            },
            {
              "id": 3,
              "type": "sensor",
              "rail": "PN1:0",
              "slot": 6,
              "on": false,
              "tripped": false,
              "tag": "PVA1",
              "coil": false,
              "sensorVoltage": 220,
              "sensorCurrentA": 59.99999999999916
            },
            {
              "id": 4,
              "type": "rcd",
              "rail": "PN1:0",
              "slot": 8,
              "on": true,
              "tripped": false,
              "tag": "QD1",
              "ratedCurrent": 63,
              "ratedLeakageMa": 300,
              "ratedVoltage": 220,
              "customName": "УЗО 2P, 63 А, 300 мА",
              "rcdLeakageMa": 4.433786671143025e-9,
              "coil": false
            },
            {
              "id": 5,
              "type": "crossN",
              "rail": "PN1:0",
              "slot": 10,
              "on": false,
              "tripped": false,
              "tag": "XN1",
              "coil": false
            },
            {
              "id": 6,
              "type": "crossPE",
              "rail": "PN1:0",
              "slot": 12,
              "on": false,
              "tripped": false,
              "tag": "XPE1",
              "coil": false
            },
            {
              "id": 9,
              "type": "rcd",
              "rail": "PN1:1",
              "slot": 0,
              "on": true,
              "tripped": false,
              "tag": "QD2",
              "ratedCurrent": 50,
              "ratedLeakageMa": 30,
              "ratedVoltage": 220,
              "customName": "УЗО 2P, 50 А, 30 мА",
              "rcdLeakageMa": 3.552713678800501e-9,
              "coil": false
            },
            {
              "id": 10,
              "type": "boiler",
              "on": false,
              "tripped": false,
              "tag": "E1",
              "x": 10934.266665395102,
              "y": 1027.6918919881186,
              "applianceOn": true,
              "applianceBurned": false,
              "ratedVoltage": 220,
              "ratedPower": 2000,
              "ratedCurrent": 9.090909090909092,
              "coil": false
            },
            {
              "id": 11,
              "type": "washer",
              "on": false,
              "tripped": false,
              "tag": "E2",
              "x": 8964.76124445597,
              "y": 2059.8155171712237,
              "applianceOn": true,
              "applianceBurned": false,
              "ratedVoltage": 220,
              "ratedPower": 2200,
              "ratedCurrent": 10,
              "coil": false
            },
            {
              "id": 13,
              "type": "stove",
              "on": false,
              "tripped": false,
              "tag": "E4",
              "x": 6716.147694396972,
              "y": 2039.3224830627441,
              "applianceOn": true,
              "applianceBurned": false,
              "ratedVoltage": 220,
              "ratedPower": 7000,
              "ratedCurrent": 31.818181818181817,
              "coil": false
            },
            {
              "id": 14,
              "type": "fridge",
              "on": false,
              "tripped": false,
              "tag": "E5",
              "x": 6145.863956451416,
              "y": 1596.249799728394,
              "applianceOn": true,
              "applianceBurned": false,
              "ratedVoltage": 220,
              "ratedPower": 300,
              "ratedCurrent": 1.3636363636363635,
              "coil": false
            },
            {
              "id": 15,
              "type": "split",
              "on": false,
              "tripped": false,
              "tag": "E6",
              "x": 4894.991899108887,
              "y": 1164.7748630523686,
              "applianceOn": true,
              "applianceBurned": false,
              "ratedVoltage": 220,
              "ratedPower": 1500,
              "ratedCurrent": 6.818181818181818,
              "coil": false
            },
            {
              "id": 16,
              "type": "outlet",
              "on": false,
              "tripped": false,
              "tag": "XS1",
              "x": 2861.2912358601884,
              "y": 1850.470947265625,
              "coil": false
            },
            {
              "id": 17,
              "type": "outlet",
              "on": false,
              "tripped": false,
              "tag": "XS2",
              "x": 4424.831860605876,
              "y": 1850.470947265625,
              "coil": false
            },
            {
              "id": 18,
              "type": "outlet",
              "on": false,
              "tripped": false,
              "tag": "XS3",
              "x": 7240.982184441884,
              "y": 1850.470947265625,
              "coil": false
            },
            {
              "id": 19,
              "type": "outlet",
              "on": false,
              "tripped": false,
              "tag": "XS4",
              "x": 8670.925277996063,
              "y": 1850.470947265625,
              "coil": false
            },
            {
              "id": 20,
              "type": "outlet",
              "on": false,
              "tripped": false,
              "tag": "XS5",
              "x": 10531.067957560223,
              "y": 1850.470947265625,
              "coil": false
            },
            {
              "id": 22,
              "type": "bulb",
              "on": false,
              "tripped": false,
              "tag": "EL1",
              "x": 3561.532287343343,
              "y": 782.9255676269529,
              "coil": false
            },
            {
              "id": 23,
              "type": "bulb",
              "on": false,
              "tripped": false,
              "tag": "EL2",
              "x": 4921.531852086384,
              "y": 782.9255676269529,
              "coil": false
            },
            {
              "id": 24,
              "type": "bulb",
              "on": false,
              "tripped": false,
              "tag": "EL3",
              "x": 7086.615442911784,
              "y": 782.9255676269529,
              "coil": false
            },
            {
              "id": 25,
              "type": "bulb",
              "on": false,
              "tripped": false,
              "tag": "EL4",
              "x": 9282.733665974934,
              "y": 782.9255676269529,
              "coil": false
            },
            {
              "id": 26,
              "type": "bulb",
              "on": false,
              "tripped": false,
              "tag": "EL5",
              "x": 10845.68622334798,
              "y": 782.9255676269529,
              "coil": false
            },
            {
              "id": 27,
              "type": "mcb1",
              "rail": "PN1:1",
              "slot": 2,
              "on": true,
              "tripped": false,
              "tag": "QF2",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 6.818181818182278,
              "breakerPhaseCurrents": [
                6.818181818182278
              ]
            },
            {
              "id": 28,
              "type": "mcb1",
              "rail": "PN1:1",
              "slot": 3,
              "on": true,
              "tripped": false,
              "tag": "QF3",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 0,
              "breakerPhaseCurrents": [
                0
              ]
            },
            {
              "id": 29,
              "type": "mcb1",
              "rail": "PN1:1",
              "slot": 4,
              "on": true,
              "tripped": false,
              "tag": "QF4",
              "breakerType": "C10",
              "ratedCurrent": 10,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C10",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 8.881784197001252e-13,
              "breakerPhaseCurrents": [
                8.881784197001252e-13
              ]
            },
            {
              "id": 37,
              "type": "junction",
              "on": false,
              "tripped": false,
              "tag": "XR3",
              "x": 6369.586819330852,
              "y": 765.3760958353676,
              "coil": false
            },
            {
              "id": 41,
              "type": "comb",
              "on": false,
              "tripped": false,
              "tag": "GS1",
              "x": 807,
              "y": 1427,
              "combPoles": 1,
              "combCount": 3,
              "combAnchorId": 27,
              "coil": false
            },
            {
              "id": 42,
              "type": "junction",
              "on": false,
              "tripped": false,
              "tag": "XR6",
              "x": 4424.735404888789,
              "y": 767.9255676269529,
              "coil": false
            },
            {
              "id": 43,
              "type": "junction",
              "on": false,
              "tripped": false,
              "tag": "XR7",
              "x": 2861.297755845387,
              "y": 767.9255676269529,
              "coil": false
            },
            {
              "id": 45,
              "type": "crossN",
              "rail": "PN1:1",
              "slot": 5,
              "on": false,
              "tripped": false,
              "tag": "XN2",
              "coil": false
            },
            {
              "id": 46,
              "type": "wallSwitch",
              "on": false,
              "tripped": false,
              "tag": "SA1",
              "x": 3096.5125854492185,
              "y": 1850.470947265625,
              "gangs": 1,
              "switchOn1": false,
              "switchOn2": false,
              "ratedVoltage": 220,
              "ratedCurrent": 10,
              "coil": false
            },
            {
              "id": 47,
              "type": "wallSwitch",
              "on": false,
              "tripped": false,
              "tag": "SA2",
              "x": 4666.739030965169,
              "y": 1850.470947265625,
              "gangs": 1,
              "switchOn1": false,
              "switchOn2": false,
              "ratedVoltage": 220,
              "ratedCurrent": 10,
              "coil": false
            },
            {
              "id": 48,
              "type": "wallSwitch",
              "on": false,
              "tripped": false,
              "tag": "SA3",
              "x": 7474.228356933592,
              "y": 1850.470947265625,
              "gangs": 1,
              "switchOn1": true,
              "switchOn2": false,
              "ratedVoltage": 220,
              "ratedCurrent": 10,
              "coil": false
            },
            {
              "id": 49,
              "type": "wallSwitch",
              "on": false,
              "tripped": false,
              "tag": "SA4",
              "x": 8923.377102661132,
              "y": 1850.470947265625,
              "gangs": 1,
              "switchOn1": false,
              "switchOn2": false,
              "ratedVoltage": 220,
              "ratedCurrent": 10,
              "coil": false
            },
            {
              "id": 50,
              "type": "wallSwitch",
              "on": false,
              "tripped": false,
              "tag": "SA5",
              "x": 10784.946768188476,
              "y": 1850.470947265625,
              "gangs": 1,
              "switchOn1": true,
              "switchOn2": false,
              "ratedVoltage": 220,
              "ratedCurrent": 10,
              "coil": false
            },
            {
              "id": 51,
              "type": "rcd",
              "rail": "PN1:1",
              "slot": 7,
              "on": true,
              "tripped": false,
              "tag": "QD3",
              "ratedCurrent": 80,
              "ratedLeakageMa": 30,
              "ratedVoltage": 220,
              "customName": "УЗО 2P, 80 А, 30 мА",
              "rcdLeakageMa": 2.6645352591003757e-9,
              "coil": false
            },
            {
              "id": 52,
              "type": "mcb1",
              "rail": "PN1:1",
              "slot": 9,
              "on": true,
              "tripped": false,
              "tag": "QF5",
              "breakerType": "C32",
              "ratedCurrent": 32,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C32",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 31.818181818181746,
              "breakerPhaseCurrents": [
                31.818181818181746
              ]
            },
            {
              "id": 53,
              "type": "mcb1",
              "rail": "PN1:1",
              "slot": 10,
              "on": true,
              "tripped": false,
              "tag": "QF6",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 1.3636363636364557,
              "breakerPhaseCurrents": [
                1.3636363636364557
              ]
            },
            {
              "id": 54,
              "type": "mcb1",
              "rail": "PN1:1",
              "slot": 11,
              "on": true,
              "tripped": false,
              "tag": "QF7",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 4.440892098500626e-13,
              "breakerPhaseCurrents": [
                4.440892098500626e-13
              ]
            },
            {
              "id": 55,
              "type": "mcb1",
              "rail": "PN1:1",
              "slot": 12,
              "on": true,
              "tripped": false,
              "tag": "QF8",
              "breakerType": "C10",
              "ratedCurrent": 10,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C10",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 0.45454545454504114,
              "breakerPhaseCurrents": [
                0.45454545454504114
              ]
            },
            {
              "id": 56,
              "type": "crossN",
              "rail": "PN1:1",
              "slot": 13,
              "on": false,
              "tripped": false,
              "tag": "XN3",
              "coil": false
            },
            {
              "id": 57,
              "type": "comb",
              "on": false,
              "tripped": false,
              "tag": "GS2",
              "x": 1174.5,
              "y": 1427,
              "combPoles": 1,
              "combCount": 4,
              "combAnchorId": 52,
              "customName": "Монтажная гребёнка PIN",
              "ratedVoltage": 220,
              "coil": false
            },
            {
              "id": 58,
              "type": "rcd",
              "rail": "PN1:2",
              "slot": 0,
              "on": true,
              "tripped": false,
              "tag": "QD4",
              "ratedCurrent": 50,
              "ratedLeakageMa": 30,
              "ratedVoltage": 220,
              "customName": "УЗО 2P, 50 А, 30 мА",
              "rcdLeakageMa": 4.440892098500626e-10,
              "coil": false
            },
            {
              "id": 59,
              "type": "mcb1",
              "rail": "PN1:2",
              "slot": 2,
              "on": true,
              "tripped": false,
              "tag": "QF9",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 10.000000000000231,
              "breakerPhaseCurrents": [
                10.000000000000231
              ]
            },
            {
              "id": 60,
              "type": "mcb1",
              "rail": "PN1:2",
              "slot": 3,
              "on": true,
              "tripped": false,
              "tag": "QF10",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 4.440892098500626e-13,
              "breakerPhaseCurrents": [
                4.440892098500626e-13
              ]
            },
            {
              "id": 61,
              "type": "mcb1",
              "rail": "PN1:2",
              "slot": 4,
              "on": true,
              "tripped": false,
              "tag": "QF11",
              "breakerType": "C10",
              "ratedCurrent": 10,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C10",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 4.440892098500626e-13,
              "breakerPhaseCurrents": [
                4.440892098500626e-13
              ]
            },
            {
              "id": 62,
              "type": "comb",
              "on": false,
              "tripped": false,
              "tag": "GS3",
              "x": 807,
              "y": 1827,
              "combPoles": 1,
              "combCount": 3,
              "combAnchorId": 59,
              "coil": false
            },
            {
              "id": 63,
              "type": "crossN",
              "rail": "PN1:2",
              "slot": 5,
              "on": false,
              "tripped": false,
              "tag": "XN4",
              "coil": false
            },
            {
              "id": 64,
              "type": "rcd",
              "rail": "PN1:2",
              "slot": 7,
              "on": true,
              "tripped": false,
              "tag": "QD5",
              "ratedCurrent": 50,
              "ratedLeakageMa": 30,
              "ratedVoltage": 220,
              "customName": "УЗО 2P, 50 А, 30 мА",
              "rcdLeakageMa": 4.440892098500626e-10,
              "coil": false
            },
            {
              "id": 65,
              "type": "mcb1",
              "rail": "PN1:2",
              "slot": 9,
              "on": true,
              "tripped": false,
              "tag": "QF12",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 4.440892098500626e-13,
              "breakerPhaseCurrents": [
                4.440892098500626e-13
              ]
            },
            {
              "id": 66,
              "type": "mcb1",
              "rail": "PN1:2",
              "slot": 10,
              "on": true,
              "tripped": false,
              "tag": "QF13",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C16",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 9.09090909090926,
              "breakerPhaseCurrents": [
                9.09090909090926
              ]
            },
            {
              "id": 67,
              "type": "mcb1",
              "rail": "PN1:2",
              "slot": 11,
              "on": true,
              "tripped": false,
              "tag": "QF14",
              "breakerType": "C10",
              "ratedCurrent": 10,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C10",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 0.45454545454548523,
              "breakerPhaseCurrents": [
                0.45454545454548523
              ]
            },
            {
              "id": 68,
              "type": "crossN",
              "rail": "PN1:2",
              "slot": 12,
              "on": false,
              "tripped": false,
              "tag": "XN5",
              "coil": false
            },
            {
              "id": 70,
              "type": "crossPE",
              "rail": "PN1:2",
              "slot": 14,
              "on": false,
              "tripped": false,
              "tag": "XPE2",
              "coil": false
            },
            {
              "id": 71,
              "type": "comb",
              "on": false,
              "tripped": false,
              "tag": "GS4",
              "x": 1174.5,
              "y": 1827,
              "combPoles": 1,
              "combCount": 3,
              "combAnchorId": 65,
              "coil": false
            }
          ],
          "relays": [],
          "wires": [
            {
              "id": 1,
              "a": {
                "devId": "IN",
                "key": "L1"
              },
              "b": {
                "devId": 2,
                "key": "L_in"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 699.6995230356853,
                  "y": 1007.75
                },
                {
                  "x": 699.6995230356853,
                  "y": 1338.75
                }
              ]
            },
            {
              "id": 2,
              "a": {
                "devId": 2,
                "key": "L_out"
              },
              "b": {
                "devId": 1,
                "key": "t0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 911.4389425277711,
                  "y": 1338.75
                },
                {
                  "x": 911.4389425277711,
                  "y": 1021.25
                }
              ]
            },
            {
              "id": 3,
              "a": {
                "devId": 1,
                "key": "b0"
              },
              "b": {
                "devId": 3,
                "key": "L_in"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1016.2521928787232,
                  "y": 1338.75
                },
                {
                  "x": 1016.2521928787232,
                  "y": 1021.25
                }
              ]
            },
            {
              "id": 4,
              "a": {
                "devId": 3,
                "key": "L_out"
              },
              "b": {
                "devId": 4,
                "key": "tL"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1119.6556247075403,
                  "y": 1338.75
                },
                {
                  "x": 1119.6556247075403,
                  "y": 1021.25
                }
              ]
            },
            {
              "id": 5,
              "a": {
                "devId": "IN",
                "key": "N"
              },
              "b": {
                "devId": 2,
                "key": "N_in"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 786,
                  "y": 1015.7328408559164
                },
                {
                  "x": 692.6007619857788,
                  "y": 1015.7328408559164
                },
                {
                  "x": 692.6007619857788,
                  "y": 1344.7748630523686
                },
                {
                  "x": 833.25,
                  "y": 1344.7748630523686
                }
              ]
            },
            {
              "id": 6,
              "a": {
                "devId": 2,
                "key": "N_out"
              },
              "b": {
                "devId": 1,
                "key": "t1"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 885.75,
                  "y": 1344.7748630523686
                },
                {
                  "x": 918.25,
                  "y": 1344.7748630523686
                },
                {
                  "x": 918.25,
                  "y": 1013.0092188517252
                },
                {
                  "x": 990.75,
                  "y": 1013.0092188517252
                }
              ]
            },
            {
              "id": 7,
              "a": {
                "devId": 1,
                "key": "b1"
              },
              "b": {
                "devId": 3,
                "key": "N_in"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 990.75,
                  "y": 1344.7748630523686
                },
                {
                  "x": 1023.25,
                  "y": 1344.7748630523686
                },
                {
                  "x": 1023.25,
                  "y": 1013.0092188517252
                },
                {
                  "x": 1095.75,
                  "y": 1013.0092188517252
                }
              ]
            },
            {
              "id": 8,
              "a": {
                "devId": 3,
                "key": "N_out"
              },
              "b": {
                "devId": 4,
                "key": "tN"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1095.75,
                  "y": 1344.7748630523686
                },
                {
                  "x": 1128.25,
                  "y": 1344.7748630523686
                },
                {
                  "x": 1128.25,
                  "y": 1013.0092188517252
                },
                {
                  "x": 1200.75,
                  "y": 1013.0092188517252
                }
              ]
            },
            {
              "id": 11,
              "a": {
                "devId": 4,
                "key": "bL"
              },
              "b": {
                "devId": 9,
                "key": "tL"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1148.25,
                  "y": 1408.731150563558
                },
                {
                  "x": 728.25,
                  "y": 1408.731150563558
                }
              ]
            },
            {
              "id": 12,
              "a": {
                "devId": 9,
                "key": "bL"
              },
              "b": {
                "devId": 27,
                "key": "t0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 700.775305366516,
                  "y": 1738.75
                },
                {
                  "x": 700.775305366516,
                  "y": 1421.25
                }
              ]
            },
            {
              "id": 13,
              "a": {
                "devId": 4,
                "key": "bN"
              },
              "b": {
                "devId": 5,
                "key": "k0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1228.9369533538816,
                  "y": 1338.75
                },
                {
                  "x": 1228.9369533538816,
                  "y": 1072.25
                }
              ]
            },
            {
              "id": 20,
              "a": {
                "devId": 5,
                "key": "k7"
              },
              "b": {
                "devId": 9,
                "key": "tN"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1243.5,
                  "y": 1394.3438671112062
                },
                {
                  "x": 780.75,
                  "y": 1394.3438671112062
                }
              ]
            },
            {
              "id": 33,
              "a": {
                "devId": 9,
                "key": "bN"
              },
              "b": {
                "devId": 45,
                "key": "k0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 670.0951253255208,
                  "y": 1738.75
                },
                {
                  "x": 670.0951253255208,
                  "y": 1384.8357299168904
                },
                {
                  "x": 981,
                  "y": 1384.8357299168904
                }
              ]
            },
            {
              "id": 57,
              "a": {
                "devId": 29,
                "key": "b0"
              },
              "b": {
                "devId": 43,
                "key": "top1"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 1600.0435592651365,
                  "y": 1738.75
                },
                {
                  "x": 1600.0435592651365,
                  "y": 756.1481524149578
                },
                {
                  "x": 2938.297755845387,
                  "y": 756.1481524149578
                },
                {
                  "x": 2938.297755845387,
                  "y": 756.2755676269529
                }
              ]
            },
            {
              "id": 58,
              "a": {
                "devId": 43,
                "key": "top0"
              },
              "b": {
                "devId": 46,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 2962.797755845387,
                  "y": 855.575567626953
                },
                {
                  "x": 2962.797755845387,
                  "y": 823.9253664652505
                },
                {
                  "x": 2992.9492902437833,
                  "y": 823.9253664652505
                },
                {
                  "x": 2992.9492902437833,
                  "y": 1804.7711185455323
                },
                {
                  "x": 3146.9125854492186,
                  "y": 1804.7711185455323
                }
              ]
            },
            {
              "id": 59,
              "a": {
                "devId": 46,
                "key": "O1"
              },
              "b": {
                "devId": 22,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 3203.6125854492184,
                  "y": 1793.1629850387574
                },
                {
                  "x": 3005.7215475718176,
                  "y": 1793.1629850387574
                },
                {
                  "x": 3005.7215475718176,
                  "y": 747.1755676269529
                }
              ]
            },
            {
              "id": 60,
              "a": {
                "devId": 43,
                "key": "top2"
              },
              "b": {
                "devId": 42,
                "key": "top0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [],
              "autoLane": {
                "side": "top",
                "offset": 0
              }
            },
            {
              "id": 61,
              "a": {
                "devId": 42,
                "key": "top0"
              },
              "b": {
                "devId": 47,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 4526.235404888789,
                  "y": 855.575567626953
                },
                {
                  "x": 4526.235404888789,
                  "y": 823.635984802246
                },
                {
                  "x": 4559.293463373184,
                  "y": 823.635984802246
                },
                {
                  "x": 4559.293463373184,
                  "y": 1805.215837510427
                },
                {
                  "x": 4717.139030965169,
                  "y": 1805.215837510427
                }
              ]
            },
            {
              "id": 62,
              "a": {
                "devId": 47,
                "key": "O1"
              },
              "b": {
                "devId": 23,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 4773.8390309651695,
                  "y": 1794.0576651891072
                },
                {
                  "x": 4569.821799659728,
                  "y": 1794.0576651891072
                },
                {
                  "x": 4569.821799659728,
                  "y": 747.1755676269529
                }
              ]
            },
            {
              "id": 64,
              "a": {
                "devId": 16,
                "key": "N"
              },
              "b": {
                "devId": 43,
                "key": "bottom1"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": []
            },
            {
              "id": 65,
              "a": {
                "devId": 43,
                "key": "bottom2"
              },
              "b": {
                "devId": 42,
                "key": "bottom0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 3017.4104280153906,
                  "y": 989.5755676269529
                },
                {
                  "x": 3017.4104280153906,
                  "y": 736.1666124979652
                },
                {
                  "x": 4480.74007941882,
                  "y": 736.1666124979652
                },
                {
                  "x": 4480.74007941882,
                  "y": 989.5755676269529
                }
              ],
              "autoLane": {
                "side": "bottom",
                "offset": 0
              }
            },
            {
              "id": 66,
              "a": {
                "devId": 17,
                "key": "N"
              },
              "b": {
                "devId": 42,
                "key": "bottom1"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 4534.126785914103,
                  "y": 1814.720947265625
                },
                {
                  "x": 4534.126785914103,
                  "y": 989.5755676269529
                }
              ]
            },
            {
              "id": 67,
              "a": {
                "devId": 23,
                "key": "N"
              },
              "b": {
                "devId": 42,
                "key": "bottom2"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 4997.131852086384,
                  "y": 740.3945407867428
                },
                {
                  "x": 4578.187971989314,
                  "y": 740.3945407867428
                },
                {
                  "x": 4578.187971989314,
                  "y": 890.2755676269528
                }
              ]
            },
            {
              "id": 68,
              "a": {
                "devId": 22,
                "key": "N"
              },
              "b": {
                "devId": 43,
                "key": "bottom2"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 3637.132287343343,
                  "y": 725.4150891621905
                },
                {
                  "x": 2997.797755845387,
                  "y": 725.4150891621905
                }
              ]
            },
            {
              "id": 69,
              "a": {
                "devId": 28,
                "key": "b0"
              },
              "b": {
                "devId": 43,
                "key": "left0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 885.75,
                  "y": 1756.506288909912
                },
                {
                  "x": 676.7386304855352,
                  "y": 1756.506288909912
                },
                {
                  "x": 676.7386304855352,
                  "y": 2299.39281908671
                },
                {
                  "x": 1011.3451863606773,
                  "y": 2299.39281908671
                },
                {
                  "x": 1011.3451863606773,
                  "y": 2350.018917671839
                },
                {
                  "x": 1607.8179798444116,
                  "y": 2350.018917671839
                },
                {
                  "x": 1607.8179798444116,
                  "y": 764.4168976465859
                },
                {
                  "x": 2849.647755845387,
                  "y": 764.4168976465859
                }
              ]
            },
            {
              "id": 70,
              "a": {
                "devId": 43,
                "key": "left2"
              },
              "b": {
                "devId": 16,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 2952.8171336809787,
                  "y": 904.4255676269529
                },
                {
                  "x": 2952.8171336809787,
                  "y": 1814.720947265625
                }
              ]
            },
            {
              "id": 71,
              "a": {
                "devId": 43,
                "key": "left1"
              },
              "b": {
                "devId": 42,
                "key": "left1"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 2987.4992687543227,
                  "y": 872.9255676269529
                },
                {
                  "x": 2987.4992687543227,
                  "y": 709.8681533813474
                },
                {
                  "x": 4413.0854048887895,
                  "y": 709.8681533813474
                }
              ]
            },
            {
              "id": 72,
              "a": {
                "devId": 42,
                "key": "left2"
              },
              "b": {
                "devId": 17,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 4522.406897274654,
                  "y": 904.4255676269529
                },
                {
                  "x": 4522.406897274654,
                  "y": 1814.720947265625
                }
              ]
            },
            {
              "id": 73,
              "a": {
                "devId": 27,
                "key": "b0"
              },
              "b": {
                "devId": 15,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 833.25,
                  "y": 1749.4967494964599
                },
                {
                  "x": 683.9909694035848,
                  "y": 1749.4967494964599
                },
                {
                  "x": 683.9909694035848,
                  "y": 2290.274406433105
                },
                {
                  "x": 1017.8213501612348,
                  "y": 2290.274406433105
                },
                {
                  "x": 1017.8213501612348,
                  "y": 2342.7431561787926
                },
                {
                  "x": 1593.8158567428595,
                  "y": 2342.7431561787926
                },
                {
                  "x": 1593.8158567428595,
                  "y": 748.1754229227703
                },
                {
                  "x": 5301.057587178548,
                  "y": 748.1754229227703
                },
                {
                  "x": 5301.057587178548,
                  "y": 1130.2748630523686
                }
              ]
            },
            {
              "id": 75,
              "a": {
                "devId": 42,
                "key": "bottom1"
              },
              "b": {
                "devId": 15,
                "key": "N"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 4547.405564800897,
                  "y": 890.2755676269529
                },
                {
                  "x": 4547.405564800897,
                  "y": 706.5847808837891
                },
                {
                  "x": 5314.991899108887,
                  "y": 706.5847808837891
                }
              ]
            },
            {
              "id": 76,
              "a": {
                "devId": 6,
                "key": "k10"
              },
              "b": {
                "devId": 43,
                "key": "right1"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 1657.7529029846191,
                  "y": 1287.75
                },
                {
                  "x": 1657.7529029846191,
                  "y": 2424.3808150370915
                },
                {
                  "x": 1704.3700508117677,
                  "y": 2424.3808150370915
                },
                {
                  "x": 1704.3700508117677,
                  "y": 728.9630412419635
                },
                {
                  "x": 2983.647755845387,
                  "y": 728.9630412419635
                }
              ]
            },
            {
              "id": 77,
              "a": {
                "devId": 43,
                "key": "right0"
              },
              "b": {
                "devId": 42,
                "key": "right0"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 3082.9477558453873,
                  "y": 719.6597991943357
                },
                {
                  "x": 4547.0854048887895,
                  "y": 719.6597991943357
                }
              ]
            },
            {
              "id": 78,
              "a": {
                "devId": 43,
                "key": "right2"
              },
              "b": {
                "devId": 16,
                "key": "PE"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 2978.120073223113,
                  "y": 904.4255676269529
                },
                {
                  "x": 2978.120073223113,
                  "y": 1814.720947265625
                }
              ]
            },
            {
              "id": 79,
              "a": {
                "devId": 42,
                "key": "right2"
              },
              "b": {
                "devId": 17,
                "key": "PE"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": []
            },
            {
              "id": 80,
              "a": {
                "devId": 42,
                "key": "right1"
              },
              "b": {
                "devId": 15,
                "key": "PE"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 4646.385404888789,
                  "y": 714.8587276458738
                },
                {
                  "x": 5327.986658287049,
                  "y": 714.8587276458738
                },
                {
                  "x": 5327.986658287049,
                  "y": 1130.2748630523686
                }
              ]
            },
            {
              "id": 81,
              "a": {
                "devId": 4,
                "key": "bL"
              },
              "b": {
                "devId": 51,
                "key": "tL"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": []
            },
            {
              "id": 82,
              "a": {
                "devId": 51,
                "key": "bL"
              },
              "b": {
                "devId": 52,
                "key": "t0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1068.4872817993162,
                  "y": 1738.75
                },
                {
                  "x": 1068.4872817993162,
                  "y": 1383.4689712524414
                },
                {
                  "x": 1200.75,
                  "y": 1383.4689712524414
                }
              ]
            },
            {
              "id": 84,
              "a": {
                "devId": 51,
                "key": "tN"
              },
              "b": {
                "devId": 5,
                "key": "k8"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1148.25,
                  "y": 1401.7404048283893
                },
                {
                  "x": 1492.0464250564576,
                  "y": 1401.7404048283893
                },
                {
                  "x": 1492.0464250564576,
                  "y": 1311.5008115132646
                },
                {
                  "x": 1267.5,
                  "y": 1311.5008115132646
                }
              ]
            },
            {
              "id": 85,
              "a": {
                "devId": 51,
                "key": "bN"
              },
              "b": {
                "devId": 56,
                "key": "k0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1073.8186673482257,
                  "y": 1738.75
                },
                {
                  "x": 1073.8186673482257,
                  "y": 1412.3638256072998
                },
                {
                  "x": 1401,
                  "y": 1412.3638256072998
                }
              ]
            },
            {
              "id": 86,
              "a": {
                "devId": 13,
                "key": "L"
              },
              "b": {
                "devId": 52,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 6962.647694396972,
                  "y": 2004.8224830627441
                },
                {
                  "x": 6962.647694396972,
                  "y": 719.1681522369381
                },
                {
                  "x": 1692.7446752548217,
                  "y": 719.1681522369381
                },
                {
                  "x": 1692.7446752548217,
                  "y": 2411.1760304768877
                },
                {
                  "x": 1559.5167381922397,
                  "y": 2411.1760304768877
                },
                {
                  "x": 1559.5167381922397,
                  "y": 1761.8183944702146
                },
                {
                  "x": 1200.75,
                  "y": 1761.8183944702146
                }
              ]
            },
            {
              "id": 87,
              "a": {
                "devId": 13,
                "key": "N"
              },
              "b": {
                "devId": 56,
                "key": "k7"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 6978.647694396972,
                  "y": 680.7931581179303
                },
                {
                  "x": 1636.7624448458353,
                  "y": 680.7931581179303
                },
                {
                  "x": 1636.7624448458353,
                  "y": 2442.1504782358816
                },
                {
                  "x": 1541.8073041121168,
                  "y": 2442.1504782358816
                },
                {
                  "x": 1541.8073041121168,
                  "y": 1706.6273633003232
                },
                {
                  "x": 1401,
                  "y": 1706.6273633003232
                }
              ]
            },
            {
              "id": 88,
              "a": {
                "devId": 6,
                "key": "k9"
              },
              "b": {
                "devId": 13,
                "key": "PE"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1396.5,
                  "y": 1298.2536430358887
                },
                {
                  "x": 1647.6347325642903,
                  "y": 1298.2536430358887
                },
                {
                  "x": 1647.6347325642903,
                  "y": 2435.348901367187
                },
                {
                  "x": 1716.142183748881,
                  "y": 2435.348901367187
                },
                {
                  "x": 1716.142183748881,
                  "y": 737.4766523361207
                },
                {
                  "x": 6996.687281799315,
                  "y": 737.4766523361207
                },
                {
                  "x": 6996.687281799315,
                  "y": 2004.8224830627441
                }
              ]
            },
            {
              "id": 90,
              "a": {
                "devId": 53,
                "key": "b0"
              },
              "b": {
                "devId": 14,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 1253.25,
                  "y": 1753.030434672038
                },
                {
                  "x": 1567.7345980326327,
                  "y": 1753.030434672038
                },
                {
                  "x": 1567.7345980326327,
                  "y": 2402.8809483846035
                },
                {
                  "x": 1682.1690292358405,
                  "y": 2402.8809483846035
                },
                {
                  "x": 1682.1690292358405,
                  "y": 709.2873158137006
                },
                {
                  "x": 6393.719763565063,
                  "y": 709.2873158137006
                },
                {
                  "x": 6393.719763565063,
                  "y": 1561.749799728394
                }
              ]
            },
            {
              "id": 91,
              "a": {
                "devId": 14,
                "key": "N"
              },
              "b": {
                "devId": 37,
                "key": "bottom0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": []
            },
            {
              "id": 92,
              "a": {
                "devId": 18,
                "key": "N"
              },
              "b": {
                "devId": 37,
                "key": "bottom1"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 7345.982184441884,
                  "y": 1791.082202911377
                },
                {
                  "x": 7021.593336582183,
                  "y": 1791.082202911377
                },
                {
                  "x": 7021.593336582183,
                  "y": 1465.9872809092203
                },
                {
                  "x": 7021.5300364017485,
                  "y": 1465.9872809092203
                },
                {
                  "x": 7021.5300364017485,
                  "y": 714.2039548238115
                },
                {
                  "x": 6446.586819330852,
                  "y": 714.2039548238115
                },
                {
                  "x": 6446.586819330852,
                  "y": 987.0260958353675
                }
              ]
            },
            {
              "id": 93,
              "a": {
                "devId": 24,
                "key": "N"
              },
              "b": {
                "devId": 37,
                "key": "bottom2"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 7162.2154429117845,
                  "y": 738.9067784309385
                },
                {
                  "x": 7053.261985270182,
                  "y": 738.9067784309385
                },
                {
                  "x": 7053.261985270182,
                  "y": 703.2041890462236
                },
                {
                  "x": 6523.950191879273,
                  "y": 703.2041890462236
                },
                {
                  "x": 6523.950191879273,
                  "y": 887.7260958353675
                }
              ]
            },
            {
              "id": 94,
              "a": {
                "devId": 37,
                "key": "bottom0"
              },
              "b": {
                "devId": 56,
                "key": "k8"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 6471.086819330852,
                  "y": 987.0260958353675
                },
                {
                  "x": 6471.086819330852,
                  "y": 668.5013371785486
                },
                {
                  "x": 1624.8296997070308,
                  "y": 668.5013371785486
                },
                {
                  "x": 1624.8296997070308,
                  "y": 2432.5689056396486
                },
                {
                  "x": 1550.1857013225558,
                  "y": 2432.5689056396486
                },
                {
                  "x": 1550.1857013225558,
                  "y": 1687.75
                }
              ]
            },
            {
              "id": 95,
              "a": {
                "devId": 24,
                "key": "L"
              },
              "b": {
                "devId": 48,
                "key": "O1"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 7116.015442911784,
                  "y": 746.6668454170224
                },
                {
                  "x": 7053.806446266176,
                  "y": 746.6668454170224
                },
                {
                  "x": 7053.806446266176,
                  "y": 1511.7036017100017
                },
                {
                  "x": 7053.791899188358,
                  "y": 1511.7036017100017
                },
                {
                  "x": 7053.791899188358,
                  "y": 1761.5109638214112
                },
                {
                  "x": 7581.328356933593,
                  "y": 1761.5109638214112
                }
              ]
            },
            {
              "id": 96,
              "a": {
                "devId": 48,
                "key": "L"
              },
              "b": {
                "devId": 55,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 7524.628356933592,
                  "y": 1769.3839921315512
                },
                {
                  "x": 7044.720100148516,
                  "y": 1769.3839921315512
                },
                {
                  "x": 7044.720100148516,
                  "y": 1501.3339617411295
                },
                {
                  "x": 7044.737812312442,
                  "y": 1501.3339617411295
                },
                {
                  "x": 7044.737812312442,
                  "y": 690.6805888493855
                },
                {
                  "x": 1667.1247237523394,
                  "y": 690.6805888493855
                },
                {
                  "x": 1667.1247237523394,
                  "y": 2386.4791851043706
                },
                {
                  "x": 1581.6297345638272,
                  "y": 2386.4791851043706
                },
                {
                  "x": 1581.6297345638272,
                  "y": 1738.75
                }
              ]
            },
            {
              "id": 97,
              "a": {
                "devId": 18,
                "key": "L"
              },
              "b": {
                "devId": 54,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 7308.182184441884,
                  "y": 1803.5088597615559
                },
                {
                  "x": 7009.6030158042895,
                  "y": 1803.5088597615559
                },
                {
                  "x": 7009.6030158042895,
                  "y": 1489.5704096476236
                },
                {
                  "x": 7009.619037087758,
                  "y": 1489.5704096476236
                },
                {
                  "x": 7009.619037087758,
                  "y": 699.4112434387207
                },
                {
                  "x": 1674.8917213439945,
                  "y": 699.4112434387207
                },
                {
                  "x": 1674.8917213439945,
                  "y": 2394.728414535523
                },
                {
                  "x": 1575.381024583181,
                  "y": 2394.728414535523
                },
                {
                  "x": 1575.381024583181,
                  "y": 1746.4394648234047
                },
                {
                  "x": 1305.75,
                  "y": 1746.4394648234047
                }
              ]
            },
            {
              "id": 98,
              "a": {
                "devId": 14,
                "key": "PE"
              },
              "b": {
                "devId": 37,
                "key": "right2"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 6424.134967803955,
                  "y": 1561.749799728394
                },
                {
                  "x": 6424.134967803955,
                  "y": 919.7758176167804
                },
                {
                  "x": 6491.936819330853,
                  "y": 919.7758176167804
                }
              ]
            },
            {
              "id": 99,
              "a": {
                "devId": 18,
                "key": "PE"
              },
              "b": {
                "devId": 37,
                "key": "right2"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 7383.782184441884,
                  "y": 1779.3611778259278
                },
                {
                  "x": 7033.441103204091,
                  "y": 1779.3611778259278
                },
                {
                  "x": 7033.441103204091,
                  "y": 1477.3246582031252
                },
                {
                  "x": 7033.413858127595,
                  "y": 1477.3246582031252
                },
                {
                  "x": 7033.413858127595,
                  "y": 649.585545603434
                },
                {
                  "x": 6591.236819330852,
                  "y": 649.585545603434
                }
              ]
            },
            {
              "id": 100,
              "a": {
                "devId": 9,
                "key": "tL"
              },
              "b": {
                "devId": 58,
                "key": "tL"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 728.25,
                  "y": 1409.57131245931
                },
                {
                  "x": 690.6778747558594,
                  "y": 1409.57131245931
                },
                {
                  "x": 690.6778747558594,
                  "y": 1821.25
                }
              ]
            },
            {
              "id": 101,
              "a": {
                "devId": 5,
                "key": "k9"
              },
              "b": {
                "devId": 58,
                "key": "tN"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1291.5,
                  "y": 1373.4790716807047
                },
                {
                  "x": 681.5587359110514,
                  "y": 1373.4790716807047
                },
                {
                  "x": 681.5587359110514,
                  "y": 1821.25
                }
              ]
            },
            {
              "id": 102,
              "a": {
                "devId": 58,
                "key": "bL"
              },
              "b": {
                "devId": 59,
                "key": "t0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 702.1428527832032,
                  "y": 2138.75
                },
                {
                  "x": 702.1428527832032,
                  "y": 1812.6313018798828
                },
                {
                  "x": 833.25,
                  "y": 1812.6313018798828
                }
              ]
            },
            {
              "id": 103,
              "a": {
                "devId": 59,
                "key": "b0"
              },
              "b": {
                "devId": 11,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 833.25,
                  "y": 2272.611496798198
                },
                {
                  "x": 1025.180570793152,
                  "y": 2272.611496798198
                },
                {
                  "x": 1025.180570793152,
                  "y": 2366.870700073241
                },
                {
                  "x": 632.6447158813477,
                  "y": 2366.870700073241
                },
                {
                  "x": 632.6447158813477,
                  "y": 658.6240524927777
                },
                {
                  "x": 9183.26124445597,
                  "y": 658.6240524927777
                }
              ]
            },
            {
              "id": 104,
              "a": {
                "devId": 19,
                "key": "L"
              },
              "b": {
                "devId": 60,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 8738.125277996063,
                  "y": 1767.3676002502439
                },
                {
                  "x": 9116.053316402436,
                  "y": 1767.3676002502439
                },
                {
                  "x": 9116.053316402436,
                  "y": 649.8449272155763
                },
                {
                  "x": 624.2861356735226,
                  "y": 649.8449272155763
                },
                {
                  "x": 624.2861356735226,
                  "y": 2374.5072424570717
                },
                {
                  "x": 1033.2541501363119,
                  "y": 2374.5072424570717
                },
                {
                  "x": 1033.2541501363119,
                  "y": 2262.492681884765
                },
                {
                  "x": 885.75,
                  "y": 2262.492681884765
                }
              ]
            },
            {
              "id": 105,
              "a": {
                "devId": 49,
                "key": "L"
              },
              "b": {
                "devId": 61,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 8973.777102661132,
                  "y": 1804.5420280456542
                },
                {
                  "x": 9156.242047882077,
                  "y": 1804.5420280456542
                },
                {
                  "x": 9156.242047882077,
                  "y": 641.5308574676515
                },
                {
                  "x": 613.9495629628499,
                  "y": 641.5308574676515
                },
                {
                  "x": 613.9495629628499,
                  "y": 2383.284319750468
                },
                {
                  "x": 1040.70388323466,
                  "y": 2383.284319750468
                },
                {
                  "x": 1040.70388323466,
                  "y": 2254.6618118286137
                },
                {
                  "x": 938.25,
                  "y": 2254.6618118286137
                }
              ]
            },
            {
              "id": 106,
              "a": {
                "devId": 49,
                "key": "O1"
              },
              "b": {
                "devId": 25,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 9170.508339691161,
                  "y": 1814.720947265625
                },
                {
                  "x": 9170.508339691161,
                  "y": 601.4164904276528
                },
                {
                  "x": 9214.832656987506,
                  "y": 601.4164904276528
                },
                {
                  "x": 9214.832656987506,
                  "y": 747.1755676269529
                }
              ]
            },
            {
              "id": 107,
              "a": {
                "devId": 58,
                "key": "bN"
              },
              "b": {
                "devId": 63,
                "key": "k0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 780.75,
                  "y": 2145.0184073766072
                },
                {
                  "x": 692.3592863082886,
                  "y": 2145.0184073766072
                },
                {
                  "x": 692.3592863082886,
                  "y": 1803.2975188573203
                },
                {
                  "x": 981,
                  "y": 1803.2975188573203
                }
              ]
            },
            {
              "id": 108,
              "a": {
                "devId": 19,
                "key": "N"
              },
              "b": {
                "devId": 63,
                "key": "k10"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 8775.925277996063,
                  "y": 1776.8825752894086
                },
                {
                  "x": 9129.429077688854,
                  "y": 1776.8825752894086
                },
                {
                  "x": 9129.429077688854,
                  "y": 605.2733118693036
                },
                {
                  "x": 584.661844412486,
                  "y": 605.2733118693036
                },
                {
                  "x": 584.661844412486,
                  "y": 2415.353880818685
                },
                {
                  "x": 1084.0910386403398,
                  "y": 2415.353880818685
                },
                {
                  "x": 1084.0910386403398,
                  "y": 2107.3524098714192
                },
                {
                  "x": 1053,
                  "y": 2107.3524098714192
                }
              ]
            },
            {
              "id": 109,
              "a": {
                "devId": 11,
                "key": "N"
              },
              "b": {
                "devId": 63,
                "key": "k9"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 9193.290314229327,
                  "y": 2025.3155171712237
                },
                {
                  "x": 9193.290314229327,
                  "y": 614.6379529317219
                },
                {
                  "x": 592.6987915039062,
                  "y": 614.6379529317219
                },
                {
                  "x": 592.6987915039062,
                  "y": 2407.57998307546
                },
                {
                  "x": 1077.0715435028076,
                  "y": 2407.57998307546
                },
                {
                  "x": 1077.0715435028076,
                  "y": 2114.4099148114524
                },
                {
                  "x": 1029,
                  "y": 2114.4099148114524
                }
              ]
            },
            {
              "id": 110,
              "a": {
                "devId": 25,
                "key": "N"
              },
              "b": {
                "devId": 63,
                "key": "k8"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 9358.333665974935,
                  "y": 736.9649679183958
                },
                {
                  "x": 9224.394622739155,
                  "y": 736.9649679183958
                },
                {
                  "x": 9224.394622739155,
                  "y": 623.6711100260416
                },
                {
                  "x": 598.9575375239053,
                  "y": 623.6711100260416
                },
                {
                  "x": 598.9575375239053,
                  "y": 2398.7981079737337
                },
                {
                  "x": 1069.9817797978717,
                  "y": 2398.7981079737337
                },
                {
                  "x": 1069.9817797978717,
                  "y": 2122.68667233785
                },
                {
                  "x": 1005,
                  "y": 2122.68667233785
                }
              ]
            },
            {
              "id": 113,
              "a": {
                "devId": 58,
                "key": "tL"
              },
              "b": {
                "devId": 64,
                "key": "tL"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 728.25,
                  "y": 1793.671285502116
                },
                {
                  "x": 1095.75,
                  "y": 1793.671285502116
                }
              ],
              "autoLane": {
                "side": "top",
                "offset": 0
              }
            },
            {
              "id": 115,
              "a": {
                "devId": 64,
                "key": "tN"
              },
              "b": {
                "devId": 5,
                "key": "k10"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1148.25,
                  "y": 1774.700140126546
                },
                {
                  "x": 1511.7047046661376,
                  "y": 1774.700140126546
                },
                {
                  "x": 1511.7047046661376,
                  "y": 1300.7688842773437
                },
                {
                  "x": 1315.5,
                  "y": 1300.7688842773437
                }
              ]
            },
            {
              "id": 117,
              "a": {
                "devId": 65,
                "key": "b0"
              },
              "b": {
                "devId": 20,
                "key": "L"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 1200.75,
                  "y": 2229.3033658981326
                },
                {
                  "x": 1094.8742461840316,
                  "y": 2229.3033658981326
                },
                {
                  "x": 1094.8742461840316,
                  "y": 2427.507016372681
                },
                {
                  "x": 572.8251820882161,
                  "y": 2427.507016372681
                },
                {
                  "x": 572.8251820882161,
                  "y": 595.0937646230062
                },
                {
                  "x": 10712.878934478758,
                  "y": 595.0937646230062
                },
                {
                  "x": 10712.878934478758,
                  "y": 1793.2983347574873
                },
                {
                  "x": 10598.267957560223,
                  "y": 1793.2983347574873
                }
              ]
            },
            {
              "id": 118,
              "a": {
                "devId": 10,
                "key": "L"
              },
              "b": {
                "devId": 66,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 11100.266665395102,
                  "y": 990.070739110311
                },
                {
                  "x": 10764.315009307862,
                  "y": 990.070739110311
                },
                {
                  "x": 10764.315009307862,
                  "y": 586.8385063171387
                },
                {
                  "x": 565.9759824752804,
                  "y": 586.8385063171387
                },
                {
                  "x": 565.9759824752804,
                  "y": 2434.865846633912
                },
                {
                  "x": 1101.7662528991707,
                  "y": 2434.865846633912
                },
                {
                  "x": 1101.7662528991707,
                  "y": 2237.6740292231248
                },
                {
                  "x": 1253.25,
                  "y": 2237.6740292231248
                }
              ]
            },
            {
              "id": 120,
              "a": {
                "devId": 50,
                "key": "O1"
              },
              "b": {
                "devId": 26,
                "key": "N"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 10892.046768188477,
                  "y": 1805.0807716369627
                },
                {
                  "x": 10755.313600158692,
                  "y": 1805.0807716369627
                },
                {
                  "x": 10755.313600158692,
                  "y": 562.130021158854
                },
                {
                  "x": 10801.914229838052,
                  "y": 562.130021158854
                },
                {
                  "x": 10801.914229838052,
                  "y": 738.8278757731118
                },
                {
                  "x": 10921.286223347981,
                  "y": 738.8278757731118
                }
              ]
            },
            {
              "id": 121,
              "a": {
                "devId": 50,
                "key": "L"
              },
              "b": {
                "devId": 67,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 10744.300665028888,
                  "y": 1814.720947265625
                },
                {
                  "x": 10744.300665028888,
                  "y": 577.4251878102625
                },
                {
                  "x": 557.292638905843,
                  "y": 577.4251878102625
                },
                {
                  "x": 557.292638905843,
                  "y": 2443.2885908762614
                },
                {
                  "x": 1109.6064994812014,
                  "y": 2443.2885908762614
                },
                {
                  "x": 1109.6064994812014,
                  "y": 2245.7418017705277
                },
                {
                  "x": 1305.75,
                  "y": 2245.7418017705277
                }
              ]
            },
            {
              "id": 122,
              "a": {
                "devId": 20,
                "key": "N"
              },
              "b": {
                "devId": 68,
                "key": "k10"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 10636.067957560223,
                  "y": 1805.0807716369627
                },
                {
                  "x": 10723.90066884359,
                  "y": 1805.0807716369627
                },
                {
                  "x": 10723.90066884359,
                  "y": 552.0802515665692
                },
                {
                  "x": 529.0355408986406,
                  "y": 552.0802515665692
                },
                {
                  "x": 529.0355408986406,
                  "y": 2472.6013098398844
                },
                {
                  "x": 1135.1814778645835,
                  "y": 2472.6013098398844
                },
                {
                  "x": 1135.1814778645835,
                  "y": 2269.177663167318
                },
                {
                  "x": 1360.2755360285441,
                  "y": 2269.177663167318
                },
                {
                  "x": 1360.2755360285441,
                  "y": 2117.775492000579
                },
                {
                  "x": 1420.5,
                  "y": 2117.775492000579
                }
              ]
            },
            {
              "id": 123,
              "a": {
                "devId": 10,
                "key": "N"
              },
              "b": {
                "devId": 68,
                "key": "k9"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 11144.266665395102,
                  "y": 980.7072804768882
                },
                {
                  "x": 10775.573958079021,
                  "y": 980.7072804768882
                },
                {
                  "x": 10775.573958079021,
                  "y": 561.5911838531495
                },
                {
                  "x": 537.4786314646406,
                  "y": 561.5911838531495
                },
                {
                  "x": 537.4786314646406,
                  "y": 2464.1783500671395
                },
                {
                  "x": 1127.231243387858,
                  "y": 2464.1783500671395
                },
                {
                  "x": 1127.231243387858,
                  "y": 2261.9071074167887
                },
                {
                  "x": 1351.1935225168863,
                  "y": 2261.9071074167887
                },
                {
                  "x": 1351.1935225168863,
                  "y": 2106.531530634563
                },
                {
                  "x": 1396.5,
                  "y": 2106.531530634563
                }
              ]
            },
            {
              "id": 124,
              "a": {
                "devId": 26,
                "key": "L"
              },
              "b": {
                "devId": 68,
                "key": "k8"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 1.5,
              "pts": [
                {
                  "x": 10795.783150736486,
                  "y": 747.1755676269529
                },
                {
                  "x": 10795.783150736486,
                  "y": 570.3441699981686
                },
                {
                  "x": 10795.705405871071,
                  "y": 570.3441699981686
                },
                {
                  "x": 10795.705405871071,
                  "y": 569.4028106053669
                },
                {
                  "x": 544.9485162099198,
                  "y": 569.4028106053669
                },
                {
                  "x": 544.9485162099198,
                  "y": 2456.002412923178
                },
                {
                  "x": 1119.983725420634,
                  "y": 2456.002412923178
                },
                {
                  "x": 1119.983725420634,
                  "y": 2254.2094102223723
                },
                {
                  "x": 1343.7690630594889,
                  "y": 2254.2094102223723
                },
                {
                  "x": 1343.7690630594889,
                  "y": 2098.833781496684
                },
                {
                  "x": 1372.5,
                  "y": 2098.833781496684
                }
              ]
            },
            {
              "id": 126,
              "a": {
                "devId": 20,
                "key": "PE"
              },
              "b": {
                "devId": 70,
                "key": "k7"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 10733.851272583006,
                  "y": 1814.720947265625
                },
                {
                  "x": 10733.851272583006,
                  "y": 541.7012040456134
                },
                {
                  "x": 514.91610806783,
                  "y": 541.7012040456134
                },
                {
                  "x": 514.91610806783,
                  "y": 2485.60696697235
                },
                {
                  "x": 1152.3069354375202,
                  "y": 2485.60696697235
                },
                {
                  "x": 1152.3069354375202,
                  "y": 2280.618352890014
                },
                {
                  "x": 1453.5,
                  "y": 2280.618352890014
                }
              ]
            },
            {
              "id": 127,
              "a": {
                "devId": "IN",
                "key": "PE"
              },
              "b": {
                "devId": 6,
                "key": "k0"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 854,
                  "y": 1007.75
                },
                {
                  "x": 854,
                  "y": 988.5251550038654
                },
                {
                  "x": 1348.5,
                  "y": 988.5251550038654
                }
              ]
            },
            {
              "id": 130,
              "a": {
                "devId": 10,
                "key": "PE"
              },
              "b": {
                "devId": 70,
                "key": "k8"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 11188.266665395102,
                  "y": 971.3438218434653
                },
                {
                  "x": 10786.83290685018,
                  "y": 971.3438218434653
                },
                {
                  "x": 10786.83290685018,
                  "y": 531.9890383402509
                },
                {
                  "x": 504.16506036122644,
                  "y": 531.9890383402509
                },
                {
                  "x": 504.16506036122644,
                  "y": 2498.2759934743244
                },
                {
                  "x": 1160.3099304835007,
                  "y": 2498.2759934743244
                },
                {
                  "x": 1160.3099304835007,
                  "y": 2289.7662977854416
                },
                {
                  "x": 1477.5,
                  "y": 2289.7662977854416
                }
              ]
            },
            {
              "id": 131,
              "a": {
                "devId": 64,
                "key": "bL"
              },
              "b": {
                "devId": 65,
                "key": "t0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1175.423974609375,
                  "y": 2138.75
                },
                {
                  "x": 1175.423974609375,
                  "y": 1813.2926228841145
                },
                {
                  "x": 1200.75,
                  "y": 1813.2926228841145
                }
              ]
            },
            {
              "id": 132,
              "a": {
                "devId": 45,
                "key": "k7"
              },
              "b": {
                "devId": 43,
                "key": "bottom0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 981,
                  "y": 1785.3450717926025
                },
                {
                  "x": 1063.612501144409,
                  "y": 1785.3450717926025
                },
                {
                  "x": 1063.612501144409,
                  "y": 2390.98639831543
                },
                {
                  "x": 605.3998258590698,
                  "y": 2390.98639831543
                },
                {
                  "x": 605.3998258590698,
                  "y": 632.7659790039062
                },
                {
                  "x": 2962.797755845387,
                  "y": 632.7659790039062
                },
                {
                  "x": 2962.797755845387,
                  "y": 989.5755676269529
                }
              ]
            },
            {
              "id": 133,
              "a": {
                "devId": 64,
                "key": "bN"
              },
              "b": {
                "devId": 68,
                "key": "k0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1068.7561478932703,
                  "y": 2138.75
                },
                {
                  "x": 1068.7561478932703,
                  "y": 1801.708417828878
                },
                {
                  "x": 1348.5,
                  "y": 1801.708417828878
                }
              ]
            },
            {
              "id": 134,
              "a": {
                "devId": 70,
                "key": "k2"
              },
              "b": {
                "devId": 6,
                "key": "k3"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 1665.8075302124028,
                  "y": 1872.25
                },
                {
                  "x": 1665.8075302124028,
                  "y": 1273.7781168619788
                },
                {
                  "x": 1444.591154416402,
                  "y": 1273.7781168619788
                },
                {
                  "x": 1444.591154416402,
                  "y": 1072.25
                }
              ]
            },
            {
              "id": 135,
              "a": {
                "devId": 19,
                "key": "PE"
              },
              "b": {
                "devId": 70,
                "key": "k9"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 8813.725277996062,
                  "y": 1786.5382340749106
                },
                {
                  "x": 9142.899368063607,
                  "y": 1786.5382340749106
                },
                {
                  "x": 9142.899368063607,
                  "y": 521.1878859202068
                },
                {
                  "x": 490.55734723409,
                  "y": 521.1878859202068
                },
                {
                  "x": 490.55734723409,
                  "y": 2508.9061378479
                },
                {
                  "x": 1172.9384740193684,
                  "y": 2508.9061378479
                },
                {
                  "x": 1172.9384740193684,
                  "y": 2298.32806892395
                },
                {
                  "x": 1501.5,
                  "y": 2298.32806892395
                }
              ]
            },
            {
              "id": 136,
              "a": {
                "devId": 11,
                "key": "PE"
              },
              "b": {
                "devId": 70,
                "key": "k10"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 2.5,
              "pts": [
                {
                  "x": 9271.26124445597,
                  "y": 2016.6673993428544
                },
                {
                  "x": 9203.963939158117,
                  "y": 2016.6673993428544
                },
                {
                  "x": 9203.963939158117,
                  "y": 508.97376136779747
                },
                {
                  "x": 477.25153814951625,
                  "y": 508.97376136779747
                },
                {
                  "x": 477.25153814951625,
                  "y": 2521.7432356198638
                },
                {
                  "x": 1186.477364603678,
                  "y": 2521.7432356198638
                },
                {
                  "x": 1186.477364603678,
                  "y": 2306.93683980306
                },
                {
                  "x": 1525.5,
                  "y": 2306.93683980306
                }
              ]
            }
          ],
          "conduits": [],
          "nextId": 72,
          "alignmentGuides": [],
          "alignmentSnapEnabled": true,
          "motors": [],
          "pushbuttons": [],
          "panels": [
            {
              "id": "PN1",
              "tag": "ЩР1",
              "railCount": 3,
              "x": 670,
              "y": 820,
              "inbox": true,
              "inletVoltage": 220,
              "fixed": true
            }
          ],
          "standaloneRails": false,
          "workbench": null,
          "roomScene": "household",
          "clamps": [],
          "specialProps": {
            "inbox": {
              "tag": "XT1",
              "customName": "Ввод 220 В",
              "ratedVoltage": 220,
              "frequency": 50
            },
            "multimeter": {
              "tag": "PV1",
              "customName": "Цифровой мультиметр"
            }
          },
          "special": {
            "inbox": true,
            "pushbutton": false,
            "motor": false,
            "multimeter": false
          }
        },
        "positions": {
          "inbox": {
            "x": 696,
            "y": 856
          },
          "pushbutton": {
            "x": 930,
            "y": 720
          },
          "motor": {
            "x": 463,
            "y": 875,
            "load": 0
          },
          "multimeter": {
            "x": 7335.721913146972,
            "y": 2165.864710235596,
            "redX": 7511.721913146972,
            "redY": 2119.864710235596,
            "blackX": 7395.721913146972,
            "blackY": 2119.864710235596,
            "fn": "voltage",
            "power": true,
            "aDocked": true,
            "bDocked": true,
            "a": null,
            "b": null
          }
        },
        "journal": {
          "items": [
            {
              "ts": "00:10:09",
              "msg": "SA4: клавиша 1 отключена.",
              "kind": "info"
            },
            {
              "ts": "00:10:06",
              "msg": "Клеммная колодка — механическое соединение, коммутации нет.",
              "kind": "info"
            },
            {
              "ts": "00:10:03",
              "msg": "SA5: клавиша 1 включена.",
              "kind": "info"
            },
            {
              "ts": "00:10:03",
              "msg": "SA5: клавиша 1 отключена.",
              "kind": "info"
            },
            {
              "ts": "00:09:02",
              "msg": "SA2: клавиша 1 отключена.",
              "kind": "info"
            },
            {
              "ts": "00:09:00",
              "msg": "SA1: клавиша 1 отключена.",
              "kind": "info"
            },
            {
              "ts": "00:01:05",
              "msg": "Провод: начало на зажиме XN5 : 8 — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:57:09",
              "msg": "Провод проложен: E2 : PE · корпус — XPE2 : 8 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:57:04",
              "msg": "Провод: начало на зажиме E2 : PE · корпус — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:56:59",
              "msg": "Провод №112 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:55:49",
              "msg": "Провод проложен: XS4 : PE · ввод — XPE2 : 7 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:55:34",
              "msg": "Провод: начало на зажиме XS4 : PE · ввод — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:55:19",
              "msg": "Провод №111 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:53:09",
              "msg": "Провод проложен: XPE2 : 3 — XPE1 : 4 · 10 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:53:03",
              "msg": "Провод: начало на зажиме XPE2 : 3 — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:52:55",
              "msg": "Провод №129 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:44:42",
              "msg": "Провод проложен: QD5 : N — XN5 : 1 · 10 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:44:40",
              "msg": "Провод: начало на зажиме QD5 : N — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:44:37",
              "msg": "Провод №116 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:31:37",
              "msg": "Провод проложен: XN2 : 5 — XR7 : 7 · колодка 3 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:31:30",
              "msg": "Провод: начало на зажиме XN2 : 5 — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:31:19",
              "msg": "Провод №63 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:17:13",
              "msg": "Установлен: Монтажная гребёнка PIN — свободное размещение на рабочем поле.",
              "kind": "ok"
            },
            {
              "ts": "23:16:49",
              "msg": "Провод проложен: QD5 : 2 — QF12 : 1 · 10 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:16:48",
              "msg": "Провод: начало на зажиме QD5 : 2 — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:16:29",
              "msg": "E1: Бойлер включён.",
              "kind": "info"
            },
            {
              "ts": "23:16:21",
              "msg": "SA5: клавиша 1 включена.",
              "kind": "info"
            },
            {
              "ts": "23:16:21",
              "msg": "SA5: клавиша 1 отключена.",
              "kind": "info"
            },
            {
              "ts": "23:16:17",
              "msg": "Автомат 1P, C10: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            },
            {
              "ts": "23:16:16",
              "msg": "Автомат 1P, C10: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            },
            {
              "ts": "23:16:16",
              "msg": "Автомат 1P, C10: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            },
            {
              "ts": "23:16:15",
              "msg": "УЗО 2P, 25 А / 30 мА: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            },
            {
              "ts": "23:16:10",
              "msg": "SA5: клавиша 1 включена.",
              "kind": "info"
            },
            {
              "ts": "23:16:09",
              "msg": "SA5: клавиша 1 отключена.",
              "kind": "info"
            },
            {
              "ts": "23:16:08",
              "msg": "SA5: клавиша 1 включена.",
              "kind": "info"
            },
            {
              "ts": "23:11:16",
              "msg": "Провод проложен: E1 : PE · корпус — XPE2 : 6 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:11:07",
              "msg": "Провод: начало на зажиме E1 : PE · корпус — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:10:26",
              "msg": "Провод проложен: XPE1 : 4 — XPE2 : 4 · 10 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:10:24",
              "msg": "Провод: начало на зажиме XPE1 : 4 — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:10:21",
              "msg": "Провод №128 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:10:19",
              "msg": "Провод проложен: XPE1 : 2 — XPE2 : 1 · 10 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:10:17",
              "msg": "Провод: начало на зажиме XPE1 : 2 — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:10:08",
              "msg": "Провод проложен: XT1 : PE — XPE1 : 1 · 10 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:10:07",
              "msg": "Провод: начало на зажиме XT1 : PE — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:10:06",
              "msg": "Провод №10 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:09:39",
              "msg": "Провод проложен: XS5 : PE · ввод — XPE2 : 5 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:09:31",
              "msg": "Провод: начало на зажиме XS5 : PE · ввод — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:09:08",
              "msg": "Установлен: Кросс-модуль заземляющий PE (2×4) — рейка ЩР1 · рейка 3, позиция 15",
              "kind": "ok"
            },
            {
              "ts": "23:09:02",
              "msg": "Кросс-модуль заземляющий PE (2×4) возвращён в лоток.",
              "kind": "info"
            },
            {
              "ts": "23:08:26",
              "msg": "Установлен: Кросс-модуль заземляющий PE (2×4) — рейка ЩР1 · рейка 1, позиция 15",
              "kind": "ok"
            },
            {
              "ts": "23:08:14",
              "msg": "Провод №125 удалён.",
              "kind": "ok"
            },
            {
              "ts": "23:07:44",
              "msg": "Провод проложен: XS5 : PE · ввод — XPE1 : 3 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:07:36",
              "msg": "Провод: начало на зажиме XS5 : PE · ввод — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:07:16",
              "msg": "Провод проложен: EL5 : L — XN5 : 6 · 1,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:07:10",
              "msg": "Провод: начало на зажиме EL5 : L — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:06:50",
              "msg": "Провод проложен: E1 : N · нейтраль — XN5 : 7 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:06:46",
              "msg": "Провод: начало на зажиме E1 : N · нейтраль — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:06:23",
              "msg": "Провод проложен: XS5 : N · ввод — XN5 : 8 · 2,5 мм².",
              "kind": "ok"
            },
            {
              "ts": "23:06:19",
              "msg": "Провод: начало на зажиме XS5 : N · ввод — ЛКМ на поле добавляет точку маршрута; клик по второй клемме завершает провод.",
              "kind": "info"
            },
            {
              "ts": "23:05:58",
              "msg": "Провод проложен: SA5 : L · вход — QF14 : 2 · 1,5 мм².",
              "kind": "ok"
            }
          ],
          "faultCount": 0,
          "filter": "work"
        },
        "view": {
          "x": -173.1394297255929,
          "y": -1164.174890918393,
          "w": 11700,
          "h": 5850
        }
      }
    }
  },
  {
    "file": "Пуск-Реверс АД.ad-scheme.json",
    "modified": 1792322400375.5464,
    "data": {
      "format": "ad-trainer-scheme",
      "version": 1,
      "exported": "2026-10-18T11:19:57.282Z",
      "preset": {
        "version": 3,
        "id": "scheme-mvdqh8pu",
        "name": "Пуск-Реверс АД",
        "updated": 1792322397282,
        "state": {
          "power": true,
          "devices": [
            {
              "id": 1,
              "type": "mcb3",
              "rail": "PN1:0",
              "slot": 1,
              "on": false,
              "tripped": false,
              "tag": "QF1",
              "breakerType": "C16",
              "ratedCurrent": 16,
              "ratedVoltage": 380,
              "customName": "Автомат 3P, C16",
              "rcdLeakageMa": 0,
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 0,
              "breakerPhaseCurrents": []
            },
            {
              "id": 2,
              "type": "km1",
              "rail": "PN1:1",
              "slot": 1,
              "on": false,
              "tripped": false,
              "tag": "KM1",
              "coilU": 0,
              "coilElectrical": false,
              "coilAnim": false,
              "coil": false,
              "manualPressed": false
            },
            {
              "id": 4,
              "type": "km1",
              "rail": "PN1:1",
              "slot": 6,
              "on": false,
              "tripped": false,
              "tag": "KM2",
              "coilU": 0,
              "coilElectrical": false,
              "coilAnim": false,
              "coil": false,
              "manualPressed": false
            },
            {
              "id": 6,
              "type": "klemma",
              "rail": "PN1:0",
              "slot": 8,
              "on": false,
              "tripped": false,
              "tag": "XN1",
              "customName": "Нулевая колодка XN (шина N)",
              "wireEntrySide": "right",
              "ratedVoltage": 220,
              "coil": false
            },
            {
              "id": 7,
              "type": "mcb1",
              "rail": "PN1:0",
              "slot": 4,
              "on": false,
              "tripped": false,
              "tag": "QF2",
              "breakerType": "C2",
              "ratedCurrent": 2,
              "ratedVoltage": 220,
              "customName": "Автомат 1P, C2",
              "coil": false,
              "breakerHeat": 0,
              "breakerCurrentA": 0,
              "breakerPhaseCurrents": []
            },
            {
              "id": 8,
              "type": "lamp",
              "rail": "PN1:0",
              "slot": 5,
              "on": false,
              "tripped": false,
              "tag": "HL1",
              "indicator": "yellow",
              "customName": "Сигнальная лампа HL1, зелёная, 220 В",
              "ratedPower": 1,
              "ratedVoltage": 220,
              "coil": false
            },
            {
              "id": 9,
              "type": "lamp",
              "rail": "PN1:0",
              "slot": 6,
              "on": false,
              "tripped": false,
              "tag": "HL2",
              "indicator": "green",
              "customName": "Сигнальная лампа HL1, зелёная, 220 В",
              "ratedPower": 1,
              "ratedVoltage": 220,
              "coil": false
            },
            {
              "id": 10,
              "type": "lamp",
              "rail": "PN1:0",
              "slot": 7,
              "on": false,
              "tripped": false,
              "tag": "HL3",
              "indicator": "red",
              "coil": false
            },
            {
              "id": 13,
              "type": "pebus",
              "rail": "PN1:0",
              "slot": 15,
              "on": false,
              "tripped": false,
              "tag": "XPE1",
              "customName": "Защитная колодка XPE (шина PE)",
              "wireEntrySide": "left",
              "ratedVoltage": 220,
              "coil": false
            }
          ],
          "relays": [
            {
              "id": 3,
              "kmId": 2,
              "tripped": false,
              "set": 9,
              "tested": false,
              "tag": "KK1",
              "settingRange": "9-13",
              "tripClass": "10A",
              "phaseHeat": [
                0.23895297657946912,
                0.2389529765794699,
                0.23895297657946934
              ],
              "heat": 0.2389529765794699,
              "phaseCurrents": [
                0,
                0,
                0
              ],
              "currentA": 0,
              "customName": "Тепловое реле · класс 10A"
            },
            {
              "id": 5,
              "kmId": 4,
              "tripped": false,
              "set": 9,
              "tested": false,
              "tag": "KK2",
              "settingRange": "9-13",
              "tripClass": "10A",
              "phaseHeat": [
                0.00005047606070339348,
                0.00005047606070339373,
                0.000050476060703393656
              ],
              "heat": 0.00005047606070339373,
              "phaseCurrents": [
                0,
                0,
                0
              ],
              "currentA": 0,
              "customName": "Тепловое реле · класс 10A"
            }
          ],
          "wires": [
            {
              "id": 4,
              "a": {
                "devId": "IN",
                "key": "L1"
              },
              "b": {
                "devId": 1,
                "key": "t0"
              },
              "color": "#1c1c1c",
              "shape": "straight",
              "sectionMm2": 10,
              "pts": []
            },
            {
              "id": 5,
              "a": {
                "devId": "IN",
                "key": "L2"
              },
              "b": {
                "devId": 1,
                "key": "t1"
              },
              "color": "#8d939a",
              "shape": "straight",
              "sectionMm2": 10,
              "pts": []
            },
            {
              "id": 6,
              "a": {
                "devId": "IN",
                "key": "L3"
              },
              "b": {
                "devId": 1,
                "key": "t2"
              },
              "color": "#f3f3f3",
              "shape": "straight",
              "sectionMm2": 10,
              "pts": []
            },
            {
              "id": 11,
              "a": {
                "devId": 1,
                "key": "b0"
              },
              "b": {
                "devId": 2,
                "key": "t0"
              },
              "color": "#1c1c1c",
              "shape": "straight",
              "sectionMm2": 10,
              "pts": []
            },
            {
              "id": 12,
              "a": {
                "devId": 1,
                "key": "b1"
              },
              "b": {
                "devId": 2,
                "key": "t1"
              },
              "color": "#8d939a",
              "shape": "straight",
              "sectionMm2": 10,
              "pts": []
            },
            {
              "id": 13,
              "a": {
                "devId": 1,
                "key": "b2"
              },
              "b": {
                "devId": 2,
                "key": "t2"
              },
              "color": "#f3f3f3",
              "shape": "straight",
              "sectionMm2": 10,
              "pts": []
            },
            {
              "id": 23,
              "a": {
                "devId": "kk5",
                "key": "p0"
              },
              "b": {
                "devId": "M1",
                "key": "U1"
              },
              "color": "#1c1c1c",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 529.2338806152343,
                  "y": 903.8701464335126
                },
                {
                  "x": 1376,
                  "y": 903.8701464335126
                }
              ]
            },
            {
              "id": 24,
              "a": {
                "devId": "kk5",
                "key": "p1"
              },
              "b": {
                "devId": "M1",
                "key": "V1"
              },
              "color": "#8d939a",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 568.6088806152343,
                  "y": 882.4832218170166
                },
                {
                  "x": 1424,
                  "y": 882.4832218170166
                }
              ]
            },
            {
              "id": 25,
              "a": {
                "devId": "kk5",
                "key": "p2"
              },
              "b": {
                "devId": "M1",
                "key": "W1"
              },
              "color": "#f3f3f3",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 607.9838806152343,
                  "y": 857.4510548909501
                },
                {
                  "x": 1472,
                  "y": 857.4510548909501
                }
              ]
            },
            {
              "id": 26,
              "a": {
                "devId": "kk3",
                "key": "p0"
              },
              "b": {
                "devId": "kk5",
                "key": "p0"
              },
              "color": "#1c1c1c",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 266.7338806152343,
                  "y": 579.7270277659098
                },
                {
                  "x": 529.2338806152343,
                  "y": 579.7270277659098
                }
              ],
              "autoLane": {
                "side": "bottom",
                "offset": 0
              }
            },
            {
              "id": 27,
              "a": {
                "devId": "kk3",
                "key": "p1"
              },
              "b": {
                "devId": "kk5",
                "key": "p1"
              },
              "color": "#8d939a",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 306.1088806152343,
                  "y": 560.6570766448974
                },
                {
                  "x": 568.6088806152343,
                  "y": 560.6570766448974
                }
              ],
              "autoLane": {
                "side": "bottom",
                "offset": 0
              }
            },
            {
              "id": 28,
              "a": {
                "devId": "kk3",
                "key": "p2"
              },
              "b": {
                "devId": "kk5",
                "key": "p2"
              },
              "color": "#f3f3f3",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [],
              "autoLane": {
                "side": "bottom",
                "offset": 0
              }
            },
            {
              "id": 29,
              "a": {
                "devId": 2,
                "key": "t0"
              },
              "b": {
                "devId": 4,
                "key": "t0"
              },
              "color": "#1c1c1c",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [],
              "autoLane": {
                "side": "top",
                "offset": 0
              }
            },
            {
              "id": 30,
              "a": {
                "devId": 2,
                "key": "t1"
              },
              "b": {
                "devId": 4,
                "key": "t2"
              },
              "color": "#8d939a",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 306.1088806152343,
                  "y": 41.99549135843911
                },
                {
                  "x": 607.9838806152343,
                  "y": 41.99549135843911
                }
              ],
              "autoLane": {
                "side": "top",
                "offset": 4.719999999999999
              }
            },
            {
              "id": 31,
              "a": {
                "devId": 2,
                "key": "t2"
              },
              "b": {
                "devId": 4,
                "key": "t1"
              },
              "color": "#f3f3f3",
              "shape": "orthogonal",
              "sectionMm2": 10,
              "pts": [
                {
                  "x": 345.4838806152343,
                  "y": 30.2294858105977
                },
                {
                  "x": 568.6088806152343,
                  "y": 30.2294858105977
                }
              ],
              "autoLane": {
                "side": "top",
                "offset": 4.719999999999999
              }
            },
            {
              "id": 32,
              "a": {
                "devId": "IN",
                "key": "N"
              },
              "b": {
                "devId": 6,
                "key": "k0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 348.5463806152343,
                  "y": -356.78248958587665
                },
                {
                  "x": 702.7963806152343,
                  "y": -356.78248958587665
                }
              ]
            },
            {
              "id": 33,
              "a": {
                "devId": 7,
                "key": "b0"
              },
              "b": {
                "devId": 8,
                "key": "b0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [],
              "autoLane": {
                "side": "bottom",
                "offset": 0
              }
            },
            {
              "id": 37,
              "a": {
                "devId": 9,
                "key": "t0"
              },
              "b": {
                "devId": 8,
                "key": "t0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [],
              "autoLane": {
                "side": "top",
                "offset": 0
              }
            },
            {
              "id": 38,
              "a": {
                "devId": 10,
                "key": "t0"
              },
              "b": {
                "devId": 9,
                "key": "t0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [],
              "autoLane": {
                "side": "top",
                "offset": 0
              }
            },
            {
              "id": 40,
              "a": {
                "devId": 6,
                "key": "k1"
              },
              "b": {
                "devId": 10,
                "key": "t0"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": []
            },
            {
              "id": 41,
              "a": {
                "devId": 7,
                "key": "b0"
              },
              "b": {
                "devId": "PB1",
                "key": "stopL"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 430.7963806152343,
                  "y": -11.212451171875102
                },
                {
                  "x": 783.381472015381,
                  "y": -11.212451171875102
                },
                {
                  "x": 783.381472015381,
                  "y": 395.9474806467691
                }
              ]
            },
            {
              "id": 43,
              "a": {
                "devId": "PB1",
                "key": "stopR"
              },
              "b": {
                "devId": 4,
                "key": "a62"
              },
              "color": "#1f9d3a",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 669.9309876441955,
                  "y": 431.9474806467691
                },
                {
                  "x": 669.9309876441955,
                  "y": 324.60570001602156
                },
                {
                  "x": 607.2963806152343,
                  "y": 324.60570001602156
                }
              ]
            },
            {
              "id": 44,
              "a": {
                "devId": 4,
                "key": "a61"
              },
              "b": {
                "devId": "PB1",
                "key": "upL"
              },
              "color": "#1f9d3a",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 607.2963806152343,
                  "y": 131.08755397796617
                },
                {
                  "x": 805.6588687260946,
                  "y": 131.08755397796617
                }
              ]
            },
            {
              "id": 45,
              "a": {
                "devId": "PB1",
                "key": "upL"
              },
              "b": {
                "devId": 2,
                "key": "a54"
              },
              "color": "#1f9d3a",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 805.6588687260946,
                  "y": 599.0732404073078
                },
                {
                  "x": 234.66542498270667,
                  "y": 599.0732404073078
                },
                {
                  "x": 234.66542498270667,
                  "y": 322.73027852376293
                },
                {
                  "x": 306.7963806152343,
                  "y": 322.73027852376293
                }
              ]
            },
            {
              "id": 46,
              "a": {
                "devId": 2,
                "key": "a53"
              },
              "b": {
                "devId": 2,
                "key": "A1"
              },
              "color": "#1f9d3a",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 306.7963806152343,
                  "y": 91.90018450419092
                },
                {
                  "x": 389.32638061523426,
                  "y": 91.90018450419092
                },
                {
                  "x": 389.32638061523426,
                  "y": 91.74273694356269
                },
                {
                  "x": 420.0463806152343,
                  "y": 91.74273694356269
                }
              ]
            },
            {
              "id": 47,
              "a": {
                "devId": 2,
                "key": "A2"
              },
              "b": {
                "devId": "kk3",
                "key": "r3"
              },
              "color": "#1f9d3a",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": []
            },
            {
              "id": 50,
              "a": {
                "devId": "kk3",
                "key": "r2"
              },
              "b": {
                "devId": 6,
                "key": "k5"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 345.4838806152343,
                  "y": 472.3168736775715
                },
                {
                  "x": 450.0202072016398,
                  "y": 472.3168736775715
                },
                {
                  "x": 450.0202072016398,
                  "y": 7.448739420572764
                },
                {
                  "x": 702.7963806152343,
                  "y": 7.448739420572764
                }
              ]
            },
            {
              "id": 51,
              "a": {
                "devId": 1,
                "key": "t2"
              },
              "b": {
                "devId": 7,
                "key": "t0"
              },
              "color": "#8b5a2b",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [],
              "autoLane": {
                "side": "top",
                "offset": 0
              }
            },
            {
              "id": 52,
              "a": {
                "devId": "PB1",
                "key": "upR"
              },
              "b": {
                "devId": 2,
                "key": "A1"
              },
              "color": "#1f9d3a",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 794.2842977523804,
                  "y": 346.9474806467691
                },
                {
                  "x": 794.2842977523804,
                  "y": 589.8758178710937
                },
                {
                  "x": 441.4935026041665,
                  "y": 589.8758178710937
                },
                {
                  "x": 441.4935026041665,
                  "y": 98.53272094726547
                }
              ]
            },
            {
              "id": 53,
              "a": {
                "devId": 2,
                "key": "a53"
              },
              "b": {
                "devId": 9,
                "key": "b0"
              },
              "color": "#1f9d3a",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 363.15806248982733,
                  "y": 132.2827209472655
                },
                {
                  "x": 363.15806248982733,
                  "y": -1.491475931803535
                },
                {
                  "x": 535.7963806152343,
                  "y": -1.491475931803535
                }
              ]
            },
            {
              "id": 57,
              "a": {
                "devId": 4,
                "key": "A2"
              },
              "b": {
                "devId": "kk5",
                "key": "r3"
              },
              "color": "#d32f2f",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": []
            },
            {
              "id": 58,
              "a": {
                "devId": "PB1",
                "key": "stopR"
              },
              "b": {
                "devId": 2,
                "key": "a62"
              },
              "color": "#d32f2f",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 805.6588687260946,
                  "y": 613.0145201365151
                },
                {
                  "x": 242.4710770289102,
                  "y": 613.0145201365151
                },
                {
                  "x": 242.4710770289102,
                  "y": 328.855132293701
                },
                {
                  "x": 344.7963806152343,
                  "y": 328.855132293701
                }
              ]
            },
            {
              "id": 59,
              "a": {
                "devId": 2,
                "key": "a61"
              },
              "b": {
                "devId": "PB1",
                "key": "downL"
              },
              "color": "#d32f2f",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 344.7963806152343,
                  "y": 20.62470855712877
                },
                {
                  "x": 814.7794627507528,
                  "y": 20.62470855712877
                },
                {
                  "x": 814.7794627507528,
                  "y": 452.9474806467691
                },
                {
                  "x": 805.6588687260946,
                  "y": 452.9474806467691
                }
              ]
            },
            {
              "id": 61,
              "a": {
                "devId": 4,
                "key": "a53"
              },
              "b": {
                "devId": 4,
                "key": "A1"
              },
              "color": "#d32f2f",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 569.2963806152343,
                  "y": 98.19750289916976
                },
                {
                  "x": 651.8263806152343,
                  "y": 98.19750289916976
                },
                {
                  "x": 651.8263806152343,
                  "y": 98.53272094726547
                }
              ]
            },
            {
              "id": 62,
              "a": {
                "devId": "PB1",
                "key": "downL"
              },
              "b": {
                "devId": 4,
                "key": "a54"
              },
              "color": "#d32f2f",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 805.6588687260946,
                  "y": 580.93500734965
                },
                {
                  "x": 506.95847816467256,
                  "y": 580.93500734965
                },
                {
                  "x": 506.95847816467256,
                  "y": 289.7827209472655
                }
              ]
            },
            {
              "id": 63,
              "a": {
                "devId": "PB1",
                "key": "downR"
              },
              "b": {
                "devId": 4,
                "key": "A1"
              },
              "color": "#d32f2f",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 705.5497409184775,
                  "y": 516.9474806467691
                },
                {
                  "x": 705.5497409184775,
                  "y": 98.53272094726547
                }
              ]
            },
            {
              "id": 64,
              "a": {
                "devId": "kk5",
                "key": "r2"
              },
              "b": {
                "devId": 6,
                "key": "k4"
              },
              "color": "#2a6fd6",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 607.9838806152343,
                  "y": 472.7083824793496
                },
                {
                  "x": 713.7455067825317,
                  "y": 472.7083824793496
                },
                {
                  "x": 713.7455067825317,
                  "y": -146.26912525177022
                },
                {
                  "x": 702.7963806152343,
                  "y": -146.26912525177022
                }
              ]
            },
            {
              "id": 65,
              "a": {
                "devId": 4,
                "key": "a53"
              },
              "b": {
                "devId": 10,
                "key": "b0"
              },
              "color": "#d32f2f",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 552.9704395294189,
                  "y": 132.2827209472655
                },
                {
                  "x": 552.9704395294189,
                  "y": -31.21727905273451
                }
              ]
            },
            {
              "id": 71,
              "a": {
                "devId": "IN",
                "key": "PE"
              },
              "b": {
                "devId": 13,
                "key": "k0"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 946.2963806152343,
                  "y": -362.2172790527345
                }
              ]
            },
            {
              "id": 72,
              "a": {
                "devId": 13,
                "key": "k5"
              },
              "b": {
                "devId": "M1",
                "key": "PE"
              },
              "color": "#e8d800",
              "shape": "orthogonal",
              "sectionMm2": 4,
              "pts": [
                {
                  "x": 946.2963806152343,
                  "y": -94.52410723368337
                },
                {
                  "x": 1074.2429982503254,
                  "y": -94.52410723368337
                },
                {
                  "x": 1074.2429982503254,
                  "y": 841.9575502522785
                },
                {
                  "x": 1619,
                  "y": 841.9575502522785
                }
              ]
            }
          ],
          "conduits": [],
          "nextId": 14,
          "alignmentGuides": [],
          "alignmentSnapEnabled": true,
          "motors": [
            {
              "id": "M1",
              "tag": "M1",
              "kind": "ac",
              "x": 1250,
              "y": 960,
              "w": 313,
              "h": 351,
              "scale": 1.5,
              "load": 0,
              "polePairs": 2,
              "ratedSlipPercent": 10,
              "ratedFrequency": 50,
              "ratedVoltage": 380,
              "ratedCurrent": 9,
              "ratedPower": 4,
              "rpmActual": 0,
              "angle": 169.69891590140224
            }
          ],
          "pushbuttons": [
            {
              "id": "PB1",
              "tag": "SB1–SB3",
              "x": 872.1588687260946,
              "y": 253.94748064676912,
              "w": 170,
              "h": 320,
              "buttons": {
                "up": false,
                "stop": false,
                "down": false
              }
            }
          ],
          "panels": [
            {
              "id": "PN1",
              "tag": "ЩР1",
              "railCount": 3,
              "x": 162.54638061523428,
              "y": -549.9672790527346,
              "inbox": true,
              "inletVoltage": 380,
              "fixed": false,
              "customName": "Монтажный щит"
            }
          ],
          "standaloneRails": false,
          "workbench": {
            "x": 60,
            "y": 1350,
            "width": 1900,
            "height": 520,
            "panelId": "PN1",
            "motorId": "M1"
          },
          "roomScene": null,
          "clamps": [],
          "specialProps": {
            "inbox": {
              "tag": "XT1",
              "customName": "Ввод 3×380 В",
              "ratedVoltage": 380,
              "frequency": 50
            },
            "multimeter": {
              "tag": "PV1",
              "customName": "Цифровой мультиметр"
            }
          },
          "special": {
            "inbox": true,
            "pushbutton": false,
            "motor": false,
            "multimeter": true
          }
        },
        "positions": {
          "inbox": {
            "x": 188.54638061523428,
            "y": -513.9672790527346
          },
          "pushbutton": {
            "x": 930,
            "y": 720
          },
          "motor": {
            "x": 463,
            "y": 875,
            "load": 0
          },
          "multimeter": {
            "x": 1101.8193684895837,
            "y": 247.22733256022127,
            "redX": 1277.8193684895837,
            "redY": 201.22733256022127,
            "blackX": 1161.8193684895837,
            "blackY": 201.22733256022127,
            "fn": "voltage",
            "power": true,
            "aDocked": true,
            "bDocked": true,
            "a": null,
            "b": null
          }
        },
        "journal": {
          "items": [
            {
              "ts": "14:19:49",
              "msg": "KM1: катушка обесточена — якорь вернулся; силовые контакты и НО-контакты 13-14, 53-54 разомкнуты, НЗ-контакт 61-62 замкнут.",
              "kind": "info"
            },
            {
              "ts": "14:19:49",
              "msg": "Автомат 1P, C10: отключён (рукоятка «0»).",
              "kind": "info"
            },
            {
              "ts": "14:19:48",
              "msg": "Вводной автомат 3P, C25: отключён (рукоятка «0»).",
              "kind": "info"
            },
            {
              "ts": "14:19:37",
              "msg": "Характеристики KK2 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "14:19:30",
              "msg": "Характеристики KK1 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "14:19:12",
              "msg": "Мультиметр [Напряжение AC]: XN1 · 6 — QF1 · 2 = 219.4 В. Измеренное напряжение между щупами: 219.4 В.",
              "kind": "info"
            },
            {
              "ts": "14:19:07",
              "msg": "Мультиметр [Напряжение AC]: KM1 · 3 L2 — QF1 · 2 = 380 В. Измеренное напряжение между щупами: 380 В.",
              "kind": "info"
            },
            {
              "ts": "14:19:03",
              "msg": "Мультиметр [Напряжение AC]: KM1 · 3 L2 — KM1 · 1 L1 = 380 В. Измеренное напряжение между щупами: 380 В.",
              "kind": "info"
            },
            {
              "ts": "14:18:54",
              "msg": "KK1: уставка теплового реле — 7 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:18:53",
              "msg": "KK1: уставка теплового реле — 10 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:18:33",
              "msg": "KM1: на катушке A1–A2 появилось 220 В — якорь втянут; силовые контакты и НО-контакты 13-14, 53-54 замкнуты, НЗ-контакт 61-62 разомкнут.",
              "kind": "ok"
            },
            {
              "ts": "14:18:32",
              "msg": "Автомат 1P, C10: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            },
            {
              "ts": "14:18:30",
              "msg": "Вводной автомат 3P, C25: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            },
            {
              "ts": "14:18:29",
              "msg": "Аппарат установлен на DIN-рейку ЩР1 · рейка 1, позиция 2.",
              "kind": "ok"
            },
            {
              "ts": "14:18:24",
              "msg": "Характеристики QF2 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "14:18:20",
              "msg": "Характеристики QF1 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "14:17:58",
              "msg": "KK2: уставка теплового реле — 9 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:57",
              "msg": "KK2: уставка теплового реле — 8 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:57",
              "msg": "KK2: уставка теплового реле — 7 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:55",
              "msg": "KK1: уставка теплового реле — 9 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:53",
              "msg": "KK1: уставка теплового реле — 8 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:52",
              "msg": "KK1: уставка теплового реле — 7 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:52",
              "msg": "KK1: уставка теплового реле — 10 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:51",
              "msg": "KK1: уставка теплового реле — 9 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:50",
              "msg": "KK1: уставка теплового реле — 8 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:50",
              "msg": "KK1: уставка теплового реле — 7 А (по номинальному току двигателя).",
              "kind": "info"
            },
            {
              "ts": "14:17:45",
              "msg": "Характеристики KK2 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "14:17:37",
              "msg": "Характеристики KK1 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "17:19:57",
              "msg": "Провод №26: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:19:54",
              "msg": "Провод №27: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:19:50",
              "msg": "Провод №28: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:19:44",
              "msg": "Провод №25: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:19:42",
              "msg": "Провод №24: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:19:36",
              "msg": "Провод №24: сечение 35 мм².",
              "kind": "info"
            },
            {
              "ts": "17:19:34",
              "msg": "Провод №23: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:19:03",
              "msg": "Провод №31: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:18:58",
              "msg": "Провод №30: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:18:53",
              "msg": "Провод №29: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:18:49",
              "msg": "Провод №13: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:18:46",
              "msg": "Провод №12: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:18:44",
              "msg": "Провод №11: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:17:32",
              "msg": "Провод №6: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:17:29",
              "msg": "Провод №5: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:17:26",
              "msg": "Провод №4: сечение 10 мм².",
              "kind": "info"
            },
            {
              "ts": "17:16:11",
              "msg": "Вводной автомат 3P, C25: взведён после срабатывания, рукоятка в «0».",
              "kind": "ok"
            },
            {
              "ts": "17:16:10",
              "msg": "KM2: катушка обесточена — якорь вернулся; силовые контакты и НО-контакты 13-14, 53-54 разомкнуты, НЗ-контакт 61-62 замкнут.",
              "kind": "info"
            },
            {
              "ts": "17:16:10",
              "msg": "Автомат 1P, C10: отключён (рукоятка «0»).",
              "kind": "info"
            },
            {
              "ts": "17:15:56",
              "msg": "KM2: на катушке A1–A2 появилось 220 В — якорь втянут; силовые контакты и НО-контакты 13-14, 53-54 замкнуты, НЗ-контакт 61-62 разомкнут.",
              "kind": "ok"
            },
            {
              "ts": "17:15:56",
              "msg": "KM1: катушка обесточена — якорь вернулся; силовые контакты и НО-контакты 13-14, 53-54 разомкнуты, НЗ-контакт 61-62 замкнут.",
              "kind": "info"
            },
            {
              "ts": "17:15:56",
              "msg": "АВАРИЯ: МЕЖФАЗНОЕ КОРОТКОЕ ЗАМЫКАНИЕ (380 В). Сработал автомат QF1.",
              "kind": "err"
            },
            {
              "ts": "17:15:51",
              "msg": "Характеристики HL2 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "17:15:46",
              "msg": "Характеристики HL1 сохранены.",
              "kind": "ok"
            },
            {
              "ts": "17:15:02",
              "msg": "KM1: на катушке A1–A2 появилось 220 В — якорь втянут; силовые контакты и НО-контакты 13-14, 53-54 замкнуты, НЗ-контакт 61-62 разомкнут.",
              "kind": "ok"
            },
            {
              "ts": "17:14:59",
              "msg": "KK1: возврат кнопкой RESET — нормально закрытый контакт 95-96 замкнут, нормально открытый контакт 97-98 разомкнут.",
              "kind": "ok"
            },
            {
              "ts": "17:14:56",
              "msg": "KM1: катушка обесточена — якорь вернулся; силовые контакты и НО-контакты 13-14, 53-54 разомкнуты, НЗ-контакт 61-62 замкнут.",
              "kind": "info"
            },
            {
              "ts": "17:14:56",
              "msg": "KK1: нажата кнопка TEST — нормально закрытый контакт 95-96 разомкнут, нормально открытый контакт 97-98 замкнут.",
              "kind": "err"
            },
            {
              "ts": "17:14:55",
              "msg": "KK1: реле не срабатывало, возврат не требуется.",
              "kind": "info"
            },
            {
              "ts": "17:14:16",
              "msg": "KM1: на катушке A1–A2 появилось 220 В — якорь втянут; силовые контакты и НО-контакты 13-14, 53-54 замкнуты, НЗ-контакт 61-62 разомкнут.",
              "kind": "ok"
            },
            {
              "ts": "17:14:15",
              "msg": "Автомат 1P, C10: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            },
            {
              "ts": "17:14:14",
              "msg": "Вводной автомат 3P, C25: ВКЛЮЧЕН (рукоятка «I»).",
              "kind": "ok"
            }
          ],
          "faultCount": 6,
          "filter": "work"
        },
        "view": {
          "x": -621.1711399563898,
          "y": -749.4190791278529,
          "w": 1774.7746855896853,
          "h": 2218.4683569871067
        }
      }
    }
  },
  {
    "file": "Стенд двигателя — пустой.ad-scheme.json",
    "modified": 1792319911160.3481,
    "data": {
      "format": "ad-trainer-scheme",
      "version": 1,
      "exported": "2026-10-14T15:25:01.937Z",
      "preset": {
        "version": 3,
        "id": "stand-motor-workbench",
        "name": "Стенд двигателя — пустой",
        "updated": 1791991501937,
        "state": {
          "power": true,
          "devices": [],
          "relays": [],
          "wires": [],
          "nextId": 1,
          "motors": [
            {
              "id": "M1",
              "tag": "M1",
              "kind": "ac",
              "x": 2130,
              "y": 960,
              "w": 313,
              "h": 351,
              "scale": 1.5,
              "load": 0,
              "rpmActual": 0,
              "angle": 0,
              "polePairs": 2,
              "ratedSlipPercent": 10,
              "ratedFrequency": 50,
              "ratedVoltage": 380,
              "ratedCurrent": 9,
              "ratedPower": 4
            },
            {
              "id": "MD1",
              "tag": "MD1",
              "kind": "dc",
              "x": 346,
              "y": 960,
              "w": 313,
              "h": 351,
              "scale": 1.5,
              "load": 0,
              "rpmActual": 0,
              "angle": 0,
              "ratedArmatureVoltage": 220,
              "ratedFieldVoltage": 220,
              "ratedArmatureCurrent": 5,
              "ratedSpeed": 1500,
              "armatureResistance": 1.6,
              "fieldResistance": 220,
              "ratedPower": 1.2,
              "inertiaFactor": 0.6
            }
          ],
          "pushbuttons": [],
          "panels": [
            {
              "id": "PN1",
              "tag": "ЩР1",
              "railCount": 2,
              "x": 960,
              "y": -140,
              "inbox": true,
              "inletVoltage": 380,
              "fixed": true
            }
          ],
          "standaloneRails": false,
          "workbench": {
            "x": 60,
            "y": 1350,
            "width": 2700,
            "height": 520,
            "panelId": "PN1",
            "motorId": "M1",
            "dcMotorId": "MD1"
          },
          "clamps": [],
          "specialProps": {
            "inbox": {
              "tag": "XT1",
              "customName": "Ввод 3×380 В",
              "ratedVoltage": 380,
              "frequency": 50
            },
            "multimeter": {
              "tag": "PV1",
              "customName": "Цифровой мультиметр"
            }
          },
          "special": {
            "inbox": true,
            "pushbutton": false,
            "motor": false,
            "multimeter": false
          }
        },
        "positions": {
          "inbox": {
            "x": 50,
            "y": -140
          },
          "pushbutton": {
            "x": 930,
            "y": 720
          },
          "motor": {
            "x": 463,
            "y": 875,
            "load": 0
          },
          "multimeter": {
            "x": 875,
            "y": 1080,
            "redX": 1051,
            "redY": 1034,
            "blackX": 935,
            "blackY": 1034,
            "fn": "voltage",
            "power": true,
            "aDocked": true,
            "bDocked": true,
            "a": null,
            "b": null
          }
        },
        "journal": {
          "items": [],
          "faultCount": 0,
          "filter": "work"
        },
        "view": {
          "x": 0,
          "y": -350,
          "w": 2800,
          "h": 2500
        }
      }
    }
  }
];
