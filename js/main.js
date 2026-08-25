/**
 * Module A "110报警电话" - Master Game Controller & State Machine
 */

class ModuleAController {
  constructor() {
    this.screenEl = document.getElementById('crtScreen');
    this.fullscreenOverlay = document.getElementById('fullscreenOverlay');
    this.fullscreenContent = document.getElementById('fullscreenContent');
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

  // Clear in-monitor CRT screen
  clearMonitorScreen() {
    this.screenEl.innerHTML = '';
    this.screenEl.className = 'crt-screen';
  }

  // Clear fullscreen overlay
  clearFullscreen() {
    this.fullscreenContent.innerHTML = '';
    this.fullscreenContent.className = 'fullscreen-screen-content';
  }

  // =========================================================================
  // Act 0: 黑屏来电 (~4s, 全幅纯黑)
  // =========================================================================
  startAct0() {
    this.currentAct = 0;
    this.clearFullscreen();
    this.clearMonitorScreen();
    this.fullscreenOverlay.classList.add('active');
    this.fullscreenContent.classList.add('crt-black-breathing');

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
    this.clearFullscreen();
    this.fullscreenOverlay.classList.add('active');
    this.fullscreenContent.classList.add('crt-black-breathing');

    // 1. Top Right Recording Indicator
    const recIndicator = document.createElement('div');
    recIndicator.className = 'act1-recording-indicator';
    recIndicator.innerHTML = '线路 03 · 录音中 <span class="red-dot"></span>';
    this.fullscreenContent.appendChild(recIndicator);

    // 2. Subtitles Container
    const subtitleContainer = document.createElement('div');
    subtitleContainer.className = 'act1-subtitles-container';
    this.fullscreenContent.appendChild(subtitleContainer);

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
  // Act 2: 挂断与开机转场 (自然显现写实特写值班桌 -> 显示器通电开机 -> 完整登记单)
  // =========================================================================
  startAct2() {
    this.currentAct = 2;

    // 1. Smoothly fade out fullscreen black layer, revealing the quiet duty room desk
    this.fullscreenOverlay.classList.remove('active');
    this.clearMonitorScreen();
    this.screenEl.style.backgroundColor = '#000000';

    // 2. Brief 0.8s pause to take in the quiet midnight duty room
    setTimeout(() => {
      // 3. CRT hardware turn-on simulation inside the Great Wall monitor
      window.soundEngine.playCRTTurnOn();
      this.renderAct3Form();
      this.screenEl.classList.add('crt-booting');

      setTimeout(() => {
        this.screenEl.classList.remove('crt-booting');
        this.bindAct3Interactions();
      }, 1600);
    }, 1000);
  }

  // =========================================================================
  // Act 3: 接警单 (核心交互幕 - 左右双列完整清晰、提交按钮常驻)
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
            <div class="form-label required" style="text-align: left; padding: 1px 0;">警情内容（接警记录描述）：</div>
            <textarea id="act3DetailText" class="form-textarea slow-cursor" placeholder="请输入接警简要内容..."></textarea>
          </div>

          <div class="form-row-split font-system">
            <div class="form-label required">警情分类：</div>
            <div class="custom-xp-select-wrap">
              <div id="act3CategoryTrigger" class="custom-xp-select-trigger">
                <span id="act3CategoryVal" class="custom-xp-select-text">请选择分类</span>
                <span class="custom-xp-select-arrow">▼</span>
              </div>
              <div id="act3DropdownMenu" class="custom-xp-dropdown-menu">
                ${form.categories.map(c => `<div class="custom-xp-option" data-value="${c}">${c}</div>`).join('')}
              </div>
            </div>

            <div class="form-label">处理结果：</div>
            <input type="text" id="act3ResultInput" class="form-input-locked font-system" value="" readonly tabindex="-1" />
          </div>

          <div class="form-toolbar">
            <!-- Smart ABC Status Bar Docked Cleanly at Bottom-Left (Zero Overlap) -->
            <div class="smart-abc-docked font-system">
              <span class="smart-abc-logo">ABC</span>
              <span class="smart-abc-tag">标准</span>
              <span class="smart-abc-tag">拼</span>
              <span>半角</span>
            </div>

            <!-- Action Buttons at Bottom-Right -->
            <div class="form-toolbar-buttons">
              <button id="act3ResetBtn" class="xp-bevel-button">重置</button>
              <button id="act3SubmitBtn" class="xp-bevel-button" disabled>提交</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindAct3Interactions() {
    const detailText = document.getElementById('act3DetailText');
    const trigger = document.getElementById('act3CategoryTrigger');
    const categoryVal = document.getElementById('act3CategoryVal');
    const dropdownMenu = document.getElementById('act3DropdownMenu');
    const resultInput = document.getElementById('act3ResultInput');
    const submitBtn = document.getElementById('act3SubmitBtn');
    const resetBtn = document.getElementById('act3ResetBtn');

    if (!detailText || !trigger || !dropdownMenu) return;

    // Typing sound
    detailText.addEventListener('input', () => {
      window.soundEngine.playKeyClick();
    });

    // Toggle custom XP dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      window.soundEngine.playButtonClick();
      dropdownMenu.classList.toggle('open');
    });

    // Option selection
    const options = dropdownMenu.querySelectorAll('.custom-xp-option');
    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        window.soundEngine.playButtonClick();
        const val = opt.getAttribute('data-value');
        categoryVal.textContent = val;
        this.userCategory = val;
        resultInput.value = "无实质警情";
        this.userResult = "无实质警情";
        submitBtn.disabled = false;
        dropdownMenu.classList.remove('open');
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
      if (dropdownMenu.classList.contains('open')) {
        dropdownMenu.classList.remove('open');
      }
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      window.soundEngine.playButtonClick();
      detailText.value = '';
      categoryVal.textContent = '请选择分类';
      this.userCategory = '';
      resultInput.value = '';
      submitBtn.disabled = true;
      dropdownMenu.classList.remove('open');
    });

    // Submit button -> freeze form -> proceed to Act 4
    submitBtn.addEventListener('click', () => {
      window.soundEngine.playButtonClick();
      dropdownMenu.classList.remove('open');

      // Freeze all fields into gray readonly
      document.querySelector('.act3-window').classList.add('form-submitted-locked');
      submitBtn.disabled = true;
      resetBtn.disabled = true;
      detailText.readOnly = true;

      // Lingers briefly, then screen dims into in-monitor screensaver clock
      setTimeout(() => {
        this.startAct4();
      }, 1500);
    });

    // Default focus
    detailText.focus();
  }

  // =========================================================================
  // Act 4: 待机大屏跳秒 (~7s, 长城显示器内屏保)
  // =========================================================================
  startAct4() {
    this.currentAct = 4;
    this.clearMonitorScreen();

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
        // Instant hard-cut invert to Day Mode inside monitor screen (No transition, silent)
        screensaver.className = 'act4-screensaver day-mode';
        clockDisplay.textContent = this.data.act4.dayTime;

        // Hold on 8:00 AM, then simulate morning computer wake & popup case notice
        setTimeout(() => {
          this.startAct5();
        }, this.data.act4.dayHoldSec * 1000);
      }
    }, 1000);
  }

  // =========================================================================
  // Act 5, 6, 7: 8点后晨间电脑唤醒 -> 弹出案件通报
  // =========================================================================
  startAct5() {
    this.currentAct = 5;
    this.clearMonitorScreen();
    this.screenEl.style.backgroundColor = '#000000';

    // Simulate morning computer wake-up / boot-up
    setTimeout(() => {
      window.soundEngine.playCRTTurnOn();
      this.screenEl.classList.add('crt-booting');

      // Base system background window
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
          <div style="flex:1; display:flex; justify-content:center; align-items:center; color:#666; font-size:11px;">
            [ 系统已联机 · 等待指令 ]
          </div>
        </div>
      `;

      setTimeout(() => {
        this.screenEl.classList.remove('crt-booting');

        // System modal window pops up with click sound
        setTimeout(() => {
          window.soundEngine.playButtonClick();
          this.renderNoticeModal();
        }, 500);

      }, 1600);
    }, 400);
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
            <button id="act7GoBtn" class="xp-bevel-button font-system" style="font-weight: bold; padding: 3px 20px;">【出现场】</button>
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
  // Act 8: 标题落版 (~9s, 全屏黑场标题浮出)
  // =========================================================================
  startAct8() {
    this.currentAct = 8;
    this.clearFullscreen();

    // Smoothly fade in fullscreen black overlay (like lights turning off in duty room)
    this.fullscreenOverlay.classList.add('active');

    const titleScreen = document.createElement('div');
    titleScreen.className = 'act8-title-screen';
    this.fullscreenContent.appendChild(titleScreen);

    titleScreen.innerHTML = `
      <div class="act8-main-title">${this.data.act8.title}</div>
      <div class="act8-sub-id">${this.data.act8.recordId}</div>
      <div class="module-b-transition-hint font-mono">[ 模块 A 体验结束 · 模块 B 待接入 ]</div>
    `;

    setTimeout(() => {
      titleScreen.classList.add('visible');
      setTimeout(() => {
        const mainTitle = document.querySelector('.act8-main-title');
        const subId = document.querySelector('.act8-sub-id');
        const hint = document.querySelector('.module-b-transition-hint');
        if (mainTitle) mainTitle.classList.add('revealed');
        if (subId) subId.classList.add('revealed');
        if (hint) hint.classList.add('revealed');
      }, 400);
    }, 800);
  }
}

// Start on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.moduleA = new ModuleAController();
  window.moduleA.init();
});
