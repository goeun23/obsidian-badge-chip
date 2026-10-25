# Badge Chip

Type `!!` in the editor to open a searchable badge picker, then press Enter to insert the badge in the [Badges](https://github.com/gapmiss/badges) plugin syntax: `` `[!!type:label]` ``.

한국어 요약: 편집기에서 `!!`를 입력하면 뱃지 목록이 뜨고, 고르면 Badges 플러그인 문법으로 삽입합니다. 목록은 설정에서 바꿀 수 있습니다.

## Requirements

This plugin only inserts text. Install and enable the [Badges](https://github.com/gapmiss/badges) plugin to render the inserted badges.

## Usage

- Type `!!` at the start of a line, after a space, after `|` (inside a table), or after `>` (inside a quote or callout).
- Keep typing to filter by type, label, or any search key. For example, `!!w` narrows the list to the warning badge.
- Press `↑` / `↓` to move, `Enter` to insert, and `Esc` to dismiss.

The picker does not open in the middle of a word (such as `wow!!`) or inside an existing `[!!...]` badge.

## Configuring badges

Open **Settings → Badge Chip** and edit the list. Each line is one badge:

```
type | label | icon | description | search keys
```

| Field | Meaning |
|---|---|
| `type` | Badge type passed to Badges (for example `success`, `warning`, or any Lucide icon name). Required. |
| `label` | Text shown on the badge. Required. Must not contain `:` or `|`. |
| `icon` | [Lucide](https://lucide.dev/icons/) icon shown in the picker. Defaults to `type`. |
| `description` | Short hint shown under the label in the picker. Optional. |
| `search keys` | Extra comma-separated words that match this badge. Optional. |

Changes are saved when the text area loses focus. **Reset to defaults** restores the built-in list.

The default list is a set of Korean confidence badges (확인, 확인필요, 미승인, Future Work, CLAUDE, ADR).

## Installation

Install from **Settings → Community plugins → Browse** and search for "Badge Chip".

Manual install: download `main.js`, `manifest.json`, and `styles.css` from the latest release into `<vault>/.obsidian/plugins/badge-chip/`, then enable the plugin.

## License

[MIT](LICENSE)
