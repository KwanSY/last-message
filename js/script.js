/**
 * Dialogue Script and Timings for Module A
 * Strictly verbatim according to the design specification.
 */

window.MODULE_A_DATA = {
  // Act 0: Incoming Call
  act0: {
    durationSec: 4.0,
    rings: 2
  },

  // Act 1: The Phone Call Subtitles
  // Rules: No speaker names displayed, slow fade-in, "……" dot-by-dot, verbatim lines
  // NOTE: Bracketed actions (silence/pause) are NOT displayed on screen.
  act1: {
    totalDurationSec: 47.0,
    lines: [
      {
        text: "110，请讲。",
        startSec: 1.0,
        durationSec: 3.0
      },
      // 2 seconds silence (no text displayed)
      {
        text: "……你好。",
        dotByDot: true,
        startSec: 6.2,
        durationSec: 3.5
      },
      {
        text: "我叫许念，市二中高二（3）班的。",
        startSec: 10.5,
        durationSec: 4.0
      },
      {
        text: "嗯，你说。什么事？",
        startSec: 15.2,
        durationSec: 3.0
      },
      {
        text: "我想问一下——",
        startSec: 19.0,
        durationSec: 2.5
      },
      {
        text: "如果有人，一直、一直找你麻烦。",
        startSec: 22.2,
        durationSec: 3.8
      },
      {
        text: "报警，有用吗？",
        startSec: 26.8,
        durationSec: 3.0
      },
      {
        text: "什么性质的麻烦？有人身安全威胁吗？",
        startSec: 30.5,
        durationSec: 4.0
      },
      // 3 seconds silence (no text displayed)
      {
        text: "……没有了。没事了。",
        dotByDot: true,
        startSec: 37.5,
        durationSec: 3.5
      },
      {
        text: "姑娘？你需要——",
        startSec: 41.8,
        durationSec: 2.2
      },
      {
        text: "对不起，打扰了。晚安。",
        startSec: 44.5,
        durationSec: 2.5
      }
    ]
  },

  // Act 2: Hangup and Boot transition
  act2: {
    busyToneSec: 2.8,
    silenceSec: 2.0,
    bootAnimationSec: 2.2
  },

  // Act 3: Incident Dispatch Form default data
  act3: {
    form: {
      id: "110-20100609-0047",
      time: "2010-06-09 23:52:41",
      phone: "13926412759",
      caller: "许某，女，市二中",
      address: "—",
      defaultDetail: "",
      categories: [
        "咨询类",
        "误拨",
        "无法核实",
        "其他"
      ],
      autoResultMap: {
        "咨询类": "无实质警情"
      }
    }
  },

  // Act 4: Standby Clock Ticking (Fullscreen)
  act4: {
    nightSeconds: [
      "2010.6.9 23:59:56",
      "2010.6.9 23:59:57",
      "2010.6.9 23:59:58",
      "2010.6.9 23:59:59"
    ],
    dayTime: "2010.6.10 08:00:00",
    dayHoldSec: 2.8
  },

  // Act 5 & 6 & 7: Death Notice Modal & System Query
  act5: {
    notice: {
      title: "【案件通报】",
      body: [
        "2010年6月10日 06:47，接群众报警：城东区泗水北路旧纺织厂宿舍3号楼下发现一具女尸。",
        "死者：许念，女，16岁，市二中高二（3）班学生。",
        "初步判断为坠楼，具体死因待勘。",
        "请原接警值班民警出现场，配合调查。"
      ],
      signDept: "指挥中心",
      signDate: "2010-06-10"
    },
    systemQueryDelaySec: 1.8,
    systemQueryText: {
      line1: "关联警情：2010年6月9日 23:52 · 110呼入 · 通话47秒",
      line2Prefix: "定性："
    }
  },

  // Act 8: Title Card Drop (Fullscreen)
  act8: {
    title: "《最后一条消息》",
    recordId: "记录编号 110-20100609-0047 · 已归档",
    dimDurationSec: 2.5,
    holdDurationSec: 6.0
  }
};
