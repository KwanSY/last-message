/**
 * Module A "110报警电话" - Master Game Controller & State Machine
 */

class ModuleAController {
  constructor() {
    this.screenEl = document.getElementById('crtScreen');
    this.data = window.MODULE_A_DATA;
    this.currentAct = -1;
    this.userCategory = "咨询类";
    this.userResult = "无实质警情";
    this.audioInitialized = false;
  }

  init() {
    this.setupGlobalAudioUnlock();
    this.startAct0();
  }

  setupGlobalAudioUnlock() {
    const unlockAudio = () => {
      if (!this.audioInitialized) {
        window.soundEngine.init();
        window.soundEngine.ensureContext();
        this.audioInitialized = true;
        const overlay = document.getElementById('audioOverlay');
        if (overlay) overlay.classList.add('hidden');
      }
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }

  // Set display mode: 'mode-fullscreen' or 'mode-system'
  setDisplayMode(mode) {
    document.body.className = mode;
  }

  // Helper to clear screen content
  clearScreen() {
    this.screenEl.innerHTML = '';
    this.screenEl.className = 'crt-screen';
  }

  // =========================================================================
  // Act 0: 黑屏来电 (~4s, 全幅黑场)
  // =========================================================================
  startAct0() {
    this.currentAct = 0;
    this.setDisplayMode('mode-fullscreen');
    this.clearScreen();
    this.screenEl.classList.add('crt-black-breathing');

    // Phone rings twice in ~4 seconds
    setTimeout(() => window.soundEngine.playPhoneRing(), 400);
    setTimeout(() => window.soundEngine.playPhoneRing(), 2400);

    // Auto-answers after 4 seconds
    setTimeout(() => {
      window.soundEngine.playPhonePickup();
      this.startAct1();
    }, 4000);
  }

  // =========================================================================
  // Act 1: 通话 (~47s, 全屏黑场字幕)
  // =========================================================================
  startAct1() {
    this.currentAct = 1;
    this.setDisplayMode('mode-fullscreen');
    this.clearScreen();
    this.screenEl.classList.add('crt-black-breathing');

    // 1. Top Right Recording Indicator
    const recIndicator = document.createElement('div');
    recIndicator.className = 'act1-recording-indicator';
    recIndicator.innerHTML = '线路 03 · 录音中 <span class="red-dot"></span>';
    this.screenEl.appendChild(recIndicator);

    // 2. Subtitles Container
    const subtitleContainer = document.createElement('div');
    subtitleContainer.className = 'act1-subtitles-container';
    this.screenEl.appendChild(subtitleContainer);

    const lines = this.data.act1.lines;

    lines.forEach((lineData) => {
      setTimeout(() => {
        this.renderSubtitleLine(subtitleContainer, lineData);
      }, lineData.startSec * 1000);
    });

    // End of Act 1 -> Hang up & busy tone -> Act 2
    setTimeout(() => {
      window.soundEngine.playBusyTone(2.8);
      this.startAct2();
    }, this.data.act1.totalDurationSec * 1000);
  }

  renderSubtitleLine(container, lineData) {
    container.innerHTML = '';
    const lineEl = document.createElement('div');
    lineEl.className = 'act1-subtitle-line';
    container.appendChild(lineEl);

    // Force reflow for fade in
    void lineEl.offsetWidth;
    lineEl.classList.add('visible');

    if (lineData.dotByDot && lineData.text.startsWith('……')) {
      const remainingText = lineData.text.slice(2);
      lineEl.textContent = '·';
      setTimeout(() => { lineEl.textContent = '··'; }, 700);
      setTimeout(() => { lineEl.textContent = '…… ' + remainingText; }, 1400);
    } else {
      lineEl.textContent = lineData.text;
    }
  }

  // =========================================================================
  // Act 2: 挂断与开机转场 (~6-8s, 顺畅过渡到派出所电脑)
  // =========================================================================
  startAct2() {
    this.currentAct = 2;
    this.clearScreen();
    this.screenEl.style.backgroundColor = '#000000';

    // Black screen silence after busy tone
    setTimeout(() => {
      // 1. Smooth transition into Police Station Desk View
      this.setDisplayMode('mode-system');

      // 2. Brief 0.6s pause, then CRT hardware turn-on
      setTimeout(() => {
        window.soundEngine.playCRTTurnOn();
        this.renderAct3Form();
        this.screenEl.classList.add('crt-booting');

        setTimeout(() => {
          this.screenEl.classList.remove('crt-booting');
          this.bindAct3Interactions();
        }, 1800);
      }, 600);
    }, 1800);
  }

  // =========================================================================
  // Act 3: 接警单 (核心交互幕)
  // =========================================================================
  renderAct3Form() {
    this.currentAct = 3;
    const form = this.data.act3.form;

    this.screenEl.innerHTML = `
      <div class="act3-window xp-bevel-window">
        <div class="xp-titlebar">
          <div class="xp-titlebar-left">
            <span class="xp-titlebar-icon"></span>
            <span>110 接处警综合管理系统 [值班终端]</span>
          </div>
          <div class="xp-titlebar-controls">
            <div class="xp-control-btn">_</div>
            <div class="xp-control-btn">□</div>
            <div class="xp-control-btn close-disabled">✕</div>
          </div>
        </div>

        <div class="act3-form-container">
          <!-- 2010 Smart ABC Floating IME Bar -->
          <div class="smart-abc-bar font-system">
            <span class="smart-abc-logo">ABC</span>
            <span class="smart-abc-tag">标准</span>
            <span class="smart-abc-tag">拼</span>
            <span>半角</span>
            <span style="color: #666;">[ 1. 2. 3. ]</span>
          </div>

          <div class="form-header-title">110 接 处 警 登 记 单</div>

          <div class="form-grid font-system">
            <div class="form-label">单 号：</div>
            <input type="text" class="form-input-locked font-mono" value="${form.id}" readonly tabindex="-1" />

            <div class="form-label">接警时间：</div>
            <input type="text" class="form-input-locked font-mono" value="${form.time}" readonly tabindex="-1" />

            <div class="form-label">来电号码：</div>
            <input type="text" class="form-input-locked font-mono" value="${form.phone}" readonly tabindex="-1" />

            <div class="form-label">报 警 人：</div>
            <input type="text" class="form-input-locked" value="${form.caller}" readonly tabindex="-1" />

            <div class="form-label">事发地址：</div>
            <input type="text" class="form-input-address" value="${form.address}" readonly tabindex="-1" />
          </div>

          <div class="form-details-section font-system">
            <div class="form-label required" style="text-align: left; padding: 2px 0;">警情内容（接警记录描述）：</div>
            <textarea id="act3DetailText" class="form-textarea slow-cursor" placeholder="请输入接警简要内容..."></textarea>
          </div>

          <div class="form-row-split font-system">
            <div class="form-label required">警情分类：</div>
            <select id="act3CategorySelect" class="form-select">
              <option value="">-- 请选择分类 --</option>
              ${form.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>

            <div class="form-label">处理结果：</div>
            <input type="text" id="act3ResultInput" class="form-input-locked font-system" value="" readonly tabindex="-1" placeholder="根据分类自动带出" />
          </div>

          <div class="form-toolbar">
            <button id="act3ResetBtn" class="xp-bevel-button">重置</button>
            <button id="act3SubmitBtn" class="xp-bevel-button" disabled>提交</button>
          </div>
        </div>
      </div>
    `;
  }

  bindAct3Interactions() {
    const detailText = document.getElementById('act3DetailText');
    const categorySelect = document.getElementById('act3CategorySelect');
    const resultInput = document.getElementById('act3ResultInput');
    const submitBtn = document.getElementById('act3SubmitBtn');
    const resetBtn = document.getElementById('act3ResetBtn');

    if (!detailText || !categorySelect) return;

    // Typing sound
    detailText.addEventListener('input', () => {
      window.soundEngine.playKeyClick();
    });

    // Category change logic: Regardless of which option is chosen, auto-fill "无实质警情" (locked/read-only)
    categorySelect.addEventListener('change', () => {
      window.soundEngine.playButtonClick();
      const val = categorySelect.value;
      if (val) {
        submitBtn.disabled = false;
        resultInput.value = "无实质警情";
      } else {
        resultInput.value = "";
        submitBtn.disabled = true;
      }
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      window.soundEngine.playButtonClick();
      detailText.value = '';
      categorySelect.value = '';
      resultInput.value = '';
      submitBtn.disabled = true;
    });

    // Submit button -> freeze form -> proceed to Act 4
    submitBtn.addEventListener('click', () => {
      window.soundEngine.playButtonClick();
      this.userCategory = categorySelect.value || "咨询类";
      this.userResult = "无实质警情";

      // Freeze all fields into gray readonly
      document.querySelector('.act3-window').classList.add('form-submitted-locked');
      submitBtn.disabled = true;
      resetBtn.disabled = true;
      detailText.readOnly = true;
      categorySelect.disabled = true;

      // Lingers briefly, then screen dims into Act 4
      setTimeout(() => {
        this.startAct4();
      }, 1600);
    });

    // Default focus
    detailText.focus();
  }

  // =========================================================================
  // Act 4: 待机大屏跳秒 (~7s, Fullscreen Clock)
  // =========================================================================
  startAct4() {
    this.currentAct = 4;
    this.setDisplayMode('mode-fullscreen');
    this.clearScreen();

    const screensaver = document.createElement('div');
    screensaver.className = 'act4-screensaver night-mode';
    this.screenEl.appendChild(screensaver);

    const clockDisplay = document.createElement('div');
    clockDisplay.className = 'act4-clock-display font-dot-matrix';
    screensaver.appendChild(clockDisplay);

    const seconds = this.data.act4.nightSeconds;
    let idx = 0;

    clockDisplay.textContent = seconds[0];
    window.soundEngine.playClockTick();

    const interval = setInterval(() => {
      idx++;
      if (idx < seconds.length) {
        clockDisplay.textContent = seconds[idx];
        window.soundEngine.playClockTick();
      } else {
        clearInterval(interval);
        // Instant hard-cut invert to Day Mode (No transition, silent)
        screensaver.className = 'act4-screensaver day-mode';
        clockDisplay.textContent = this.data.act4.dayTime;

        // Hold on 8:00 AM, then transition into station background & boot simulation
        setTimeout(() => {
          this.startAct5();
        }, this.data.act4.dayHoldSec * 1000);
      }
    }, 1000);
  }

  // =========================================================================
  // Act 5, 6, 7: 8点后切回派出所背景 -> 模拟电脑开机 -> 弹出案件通报
  // =========================================================================
  startAct5() {
    this.currentAct = 5;

    // 1. Switch back to Police Station Desk View
    this.setDisplayMode('mode-system');
    this.clearScreen();
    this.screenEl.style.backgroundColor = '#000000';

    // 2. Simulate morning computer boot-up / wake-up
    setTimeout(() => {
      window.soundEngine.playCRTTurnOn();
      this.screenEl.classList.add('crt-booting');

      // Base system background
      this.screenEl.innerHTML = `
        <div class="act3-window xp-bevel-window" style="opacity: 0.85;">
          <div class="xp-titlebar">
            <div class="xp-titlebar-left">
              <span class="xp-titlebar-icon"></span>
              <span>110 接处警综合管理系统 [值班终端]</span>
            </div>
            <div class="xp-titlebar-controls">
              <div class="xp-control-btn">_</div>
              <div class="xp-control-btn">□</div>
              <div class="xp-control-btn close-disabled">✕</div>
            </div>
          </div>
          <div style="flex:1; display:flex; justify-content:center; align-items:center; color:#666; font-size:12px;">
            [ 系统已联机 · 等待指令 ]
          </div>
        </div>
      `;

      setTimeout(() => {
        this.screenEl.classList.remove('crt-booting');

        // 3. System modal window pops up with click sound
        setTimeout(() => {
          window.soundEngine.playButtonClick();
          this.renderNoticeModal();
        }, 600);

      }, 1600);
    }, 600);
  }

  renderNoticeModal() {
    const noticeData = this.data.act5.notice;

    const overlay = document.createElement('div');
    overlay.className = 'act5-modal-overlay';
    this.screenEl.appendChild(overlay);

    overlay.innerHTML = `
      <div class="act5-modal-window xp-bevel-window">
        <div class="xp-titlebar">
          <div class="xp-titlebar-left">
            <span class="xp-titlebar-icon"></span>
            <span>警务通报 - 紧急通知</span>
          </div>
          <div class="xp-titlebar-controls">
            <div class="xp-control-btn close-disabled">✕</div>
          </div>
        </div>

        <div class="act5-notice-content">
          <div class="act5-notice-title">${noticeData.title}</div>
          <div class="act5-notice-body">
            ${noticeData.body.map(p => `<p>${p}</p>`).join('')}
          </div>
          <div class="act5-notice-sign font-mono">
            ${noticeData.signDept} &nbsp; ${noticeData.signDate}
          </div>

          <!-- Act 6: System Audit Log Section -->
          <div id="act6SystemLog" class="act6-system-query font-mono">
            <div>${this.data.act5.systemQueryText.line1}</div>
            <div>${this.data.act5.systemQueryText.line2Prefix}${this.userCategory}，${this.userResult}。</div>
          </div>

          <!-- Act 7: Action Button -->
          <div class="act7-action-bar">
            <button id="act7GoBtn" class="xp-bevel-button font-system" style="font-weight: bold; padding: 6px 28px;">【出现场】</button>
          </div>
        </div>
      </div>
    `;

    // Act 6: After delay, system query fades in smoothly without sound
    setTimeout(() => {
      const logEl = document.getElementById('act6SystemLog');
      if (logEl) logEl.classList.add('visible');
    }, this.data.act5.systemQueryDelaySec * 1000);

    // Act 7: Button click
    const goBtn = document.getElementById('act7GoBtn');
    if (goBtn) {
      goBtn.focus();
      goBtn.addEventListener('click', () => {
        window.soundEngine.playButtonClick();
        this.startAct8();
      });
    }
  }

  // =========================================================================
  // Act 8: 标题落版 (~9s, Fullscreen Title Drop)
  // =========================================================================
  startAct8() {
    this.currentAct = 8;

    // 1. Slow even dimming (~2.5s, duty room light turns off)
    this.screenEl.classList.add('dimming-to-night');

    setTimeout(() => {
      this.setDisplayMode('mode-fullscreen');
      this.clearScreen();
      this.screenEl.style.backgroundColor = '#000000';
      this.screenEl.classList.remove('dimming-to-night');

      const titleScreen = document.createElement('div');
      titleScreen.className = 'act8-title-screen';
      this.screenEl.appendChild(titleScreen);

      titleScreen.innerHTML = `
        <div class="act8-main-title">${this.data.act8.title}</div>
        <div class="act8-sub-id">${this.data.act8.recordId}</div>
        <div class="module-b-transition-hint font-mono">[ 模块 A 体验结束 · 模块 B 待接入 ]</div>
      `;

      // Trigger fade in
      void titleScreen.offsetWidth;
      titleScreen.classList.add('visible');

      setTimeout(() => {
        const mainTitle = document.querySelector('.act8-main-title');
        const subId = document.querySelector('.act8-sub-id');
        const hint = document.querySelector('.module-b-transition-hint');
        if (mainTitle) mainTitle.classList.add('revealed');
        if (subId) subId.classList.add('revealed');
        if (hint) hint.classList.add('revealed');
      }, 300);

    }, this.data.act8.dimDurationSec * 1000);
  }
}

// Start on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.moduleA = new ModuleAController();
  window.moduleA.init();
});
