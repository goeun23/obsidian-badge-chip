"use strict";

const { Plugin, EditorSuggest, PluginSettingTab, Setting, setIcon } = require("obsidian");

/**
 * 기본 뱃지 목록. 설정 화면에서 바꿀 수 있고, 바꾼 목록은 data.json 에 저장된다.
 * 한 줄 형식(설정 화면): `type | label | icon | description | key1, key2`
 */
const DEFAULT_CHIPS = [
  {
    type: "success",
    label: "확인",
    icon: "lucide-check",
    desc: "코드로 직접 확인된 사실 · 확정된 정보",
    keys: ["success", "확인", "확정", "ok", "s"],
  },
  {
    type: "warning",
    label: "확인필요",
    icon: "lucide-alert-triangle",
    desc: "추측 · 사이드이펙트 위험 · 실제 코드 확인 필요",
    keys: ["warning", "확인필요", "경고", "위험", "w"],
  },
  {
    type: "danger",
    label: "미승인",
    icon: "lucide-zap",
    desc: "제안했으나 승인되지 않음 · 폐기 · deprecated",
    keys: ["danger", "미승인", "폐기", "권고", "d"],
  },
  {
    type: "todo",
    label: "Future Work",
    icon: "lucide-check-circle-2",
    desc: "미래 작업으로 결정 · TODO · 결정필요",
    keys: ["todo", "future", "fw", "미결", "결정필요", "t"],
  },
  {
    type: "lightbulb",
    label: "CLAUDE",
    icon: "lightbulb",
    desc: "Claude 가 남기는 코멘트 (화자 표시)",
    keys: ["lightbulb", "claude", "코멘트", "c"],
  },
  {
    type: "balance",
    label: "ADR",
    icon: "lucide-scale",
    desc: "의사결정 과정 · 선택지와 트레이드오프 (성격 표시)",
    keys: ["balance", "adr", "의사결정", "트레이드오프", "a"],
  },
];

/** badges 플러그인의 인라인 문법. 백틱으로 감싸야 badges 가 렌더링한다. */
function chipText(chip) {
  return "`[!!" + chip.type + ":" + chip.label + "]`";
}

function chipsToLines(chips) {
  return chips.map((c) => [c.type, c.label, c.icon, c.desc, c.keys.join(", ")].join(" | ")).join("\n");
}

/** 설정 화면의 줄 목록을 뱃지 배열로 바꾼다. type·label 이 없는 줄은 버린다. */
function linesToChips(text) {
  const chips = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const [type = "", label = "", icon = "", desc = "", keys = ""] = line.split("|").map((s) => s.trim());
    if (!type || !label) continue;
    chips.push({
      type,
      label,
      icon: icon || type,
      desc,
      keys: [...new Set([type, label, ...keys.split(",").map((k) => k.trim())].filter(Boolean))],
    });
  }
  return chips;
}

/**
 * `!!` 트리거.
 * - 앞이 줄머리 · 공백 · `|`(표) · `>`(콜아웃)일 때만 발동한다.
 *   본문 중 "대박!!" 같은 감탄에는 뜨지 않게 하려는 것이다.
 * - 앞 글자가 `[` 인 경우(= 이미 쓰여 있는 `[!!종류:문구]` 를 고치는 중)는 제외한다.
 * - `!!` 뒤의 검색어에는 공백 · `!` · `[` · `]` · 백틱을 허용하지 않는다.
 */
const TRIGGER = /(^|[\s|>])(!!)([^\s!\[\]`]*)$/;

class BadgeChipSuggest extends EditorSuggest {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.setInstructions([
      { command: "↑↓", purpose: "Navigate" },
      { command: "↵", purpose: "Insert" },
      { command: "esc", purpose: "Dismiss" },
    ]);
  }

  onTrigger(cursor, editor) {
    const before = editor.getLine(cursor.line).slice(0, cursor.ch);
    const m = before.match(TRIGGER);
    if (!m) return null;
    return {
      start: { line: cursor.line, ch: m.index + m[1].length },
      end: { line: cursor.line, ch: cursor.ch },
      query: m[3],
    };
  }

  getSuggestions(context) {
    const chips = this.plugin.settings.chips;
    this.limit = chips.length;
    const q = (context.query || "").toLowerCase();
    if (!q) return chips;
    const starts = chips.filter((c) => c.keys.some((k) => k.toLowerCase().startsWith(q)));
    if (starts.length > 0) return starts;
    return chips.filter((c) => c.keys.some((k) => k.toLowerCase().includes(q)));
  }

  renderSuggestion(chip, el) {
    el.addClass("mod-complex");
    el.addClass("badge-chip-suggestion");

    const content = el.createDiv({ cls: "suggestion-content" });
    const title = content.createDiv({ cls: "suggestion-title" });
    setIcon(title.createSpan({ cls: "badge-chip-icon" }), chip.icon);
    title.createSpan({ cls: "badge-chip-label", text: chip.label });
    title.createSpan({ cls: "badge-chip-type", text: chip.type });
    if (chip.desc) content.createDiv({ cls: "suggestion-note badge-chip-desc", text: chip.desc });

    el.createDiv({ cls: "suggestion-aux" })
      .createSpan({ cls: "badge-chip-preview", text: chipText(chip) });
  }

  selectSuggestion(chip) {
    const ctx = this.context;
    if (!ctx) return;
    const text = chipText(chip);
    ctx.editor.replaceRange(text, ctx.start, ctx.end);
    ctx.editor.setCursor({
      line: ctx.start.line,
      ch: ctx.start.ch + text.length,
    });
  }
}

class BadgeChipSettingTab extends PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Badges")
      .setDesc(
        "One badge per line: type | label | icon | description | search keys (comma-separated). " +
          "The type and label are always searchable. Icons are Lucide icon names."
      )
      .addButton((btn) =>
        btn.setButtonText("Reset to defaults").onClick(async () => {
          this.plugin.settings.chips = DEFAULT_CHIPS.map((c) => ({ ...c, keys: [...c.keys] }));
          await this.plugin.saveSettings();
          this.display();
        })
      );

    const area = containerEl.createEl("textarea", { cls: "badge-chip-settings-textarea" });
    area.value = chipsToLines(this.plugin.settings.chips);
    area.addEventListener("change", async () => {
      this.plugin.settings.chips = linesToChips(area.value);
      await this.plugin.saveSettings();
    });
  }
}

module.exports = class BadgeChipPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerEditorSuggest(new BadgeChipSuggest(this));
    this.addSettingTab(new BadgeChipSettingTab(this));
  }

  async loadSettings() {
    const data = (await this.loadData()) || {};
    const chips = Array.isArray(data.chips) && data.chips.length ? data.chips : DEFAULT_CHIPS;
    this.settings = { chips: chips.map((c) => ({ ...c, keys: [...(c.keys || [])] })) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

// 테스트용 노출 — 플러그인 동작에는 쓰이지 않는다
module.exports.__pure = { chipText, chipsToLines, linesToChips, DEFAULT_CHIPS };
