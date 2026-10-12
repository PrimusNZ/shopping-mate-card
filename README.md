# Shopping Mate Card

Two dashboard cards for Home Assistant that turn a to-do list into a proper family shopping system, made for wall tablets and phones. One file gives you:

- **Shop List Card** (`custom:shop-list-card`): the shopping list next to a catalog of everything you usually buy. Tap an item to add it, tap it again for more.
- **Shop Calculator Card** (`custom:shop-calc-card`): an in-store calculator that works through the same list, adds up what you spend and saves each shop to a history calendar.

[![Stars](https://img.shields.io/github/stars/PrimusNZ/shopping-mate-card?style=for-the-badge)](#) [![Last commit](https://img.shields.io/github/last-commit/PrimusNZ/shopping-mate-card?style=for-the-badge)](#) [![License](https://img.shields.io/github/license/PrimusNZ/shopping-mate-card?style=for-the-badge)](LICENSE)

<br>

## Table of contents

**[`Intended use`](#intended-use)**  **[`Features`](#features)**  **[`Installation`](#installation)**  **[`Setting up`](#setting-up)**  **[`Configuration`](#configuration)**  **[`Catalog format`](#catalog-format)**  **[`Styling`](#styling)**  **[`Notes`](#notes)**  **[`License`](#license)**

<br>

## Intended use

The cards are built around one routine:

1. **At home, on a wall tablet or kiosk.** Keep a catalog of the things you buy, grouped by category (Dairy, Pantry, Laundry and so on). When something runs out, tap it in the catalog and it lands on the shopping list. Anyone in the house can do this in a couple of taps, and items you have never bought before can be added on the spot and saved for next time.
2. **In the shop, on a phone.** Open the calculator on the same list. Pick an item, key in its price and quantity, and it is ticked off the list and added to a running total. The "In Cart" list shows what you have priced so far.
3. **Afterwards.** Press **Finish shop**. The shop is saved as an event in a history calendar (every item with its quantity and price, plus the total), the total is added to a running spend counter you can chart by week or month, and the ticked-off items are cleared from the list.

Both cards read and write the same shopping list, so the tablet at home and the phone in the shop always agree.

<br>

## Features

**Shop List Card**

- Two panes: the shopping list on the left, the catalog on the right. On a narrow screen (a phone) it switches to one pane at a time with two tabs.
- The header counts what is still to buy, for example "5 items on your shopping list".
- Tap a list row to tick it off. Use − and + to change the quantity, ✕ to remove it, and **Clear done** to remove everything ticked.
- The catalog is grouped by category, sorted A to Z, with a live filter that matches category and item names as you type.
- Items already on the list show how many you have.
- Long-press a catalog item to rename it, change its size or type, move it to another category, or delete it.
- **+ Add New Item** adds something new. Type a category (existing ones are suggested as you type, and a new name creates a new category), the item, an optional size or type, a quantity, and whether to keep it in the catalog for next time.
- No duplicates: an item exists once in the catalog whatever its category, and adding something already on the list raises its quantity instead of adding a second row.
- The add and edit dialogs stay open when you tap outside them, so you can tap away to dismiss the on-screen keyboard on a small display. Use Cancel to close.

**Shop Calculator Card**

- Keypad, quantity control and a running total.
- The open items from the shopping list, A to Z. Tap one to select it, then **Add** a price. It is ticked off the list and moved to the **In Cart** list.
- Long-press an item to be asked whether to remove it from the shopping list.
- An "Add item" field for anything you spot in the shop that was not on the list.
- ✕ on an In Cart line removes that price (and un-ticks the item if it has no other prices).
- **Finish shop** saves the shop to a calendar and a spend counter, then clears the ticked-off items.
- What you have priced so far is kept in the browser until the shop is finished, so a refresh does not lose it.

Both cards have a visual editor in the dashboard editor.

<br>

## Installation

**Requirements:**

- Home Assistant with at least one to-do list for the shopping list. The built-in [Local To-do](https://www.home-assistant.io/integrations/local_todo/) integration works well.
- A second to-do list for the catalog (the Shop List Card).
- For the calculator's history: a calendar that can create events, such as [Local Calendar](https://www.home-assistant.io/integrations/local_calendar/), and an `input_number` helper for the spend counter.

<details>

<summary>Without HACS</summary>

<br>

1. Download this file: [shopping-mate-card.js](https://raw.githubusercontent.com/PrimusNZ/shopping-mate-card/main/shopping-mate-card.js)
2. Add this file to your `<config>/www/shopping-mate-card` folder.
3. On your dashboard click on the icon at the right top corner then on `Edit dashboard`
4. Click again on that icon and then click on `Manage resources`
5. Click on `Add resource`
6. Copy and paste this: `/local/shopping-mate-card/shopping-mate-card.js?v=1`
7. Click on `JavaScript Module` then `Create`
8. Go back and refresh your page
9. You can now click on `Add card` in the bottom right corner and search for `Shop List Card` or `Shop Calculator`
10. After any update of the file you will have to edit `/local/shopping-mate-card/shopping-mate-card.js?v=1` and change the version to any higher number

If it's not working, just try to clear your browser cache.

</details>

<details>

<summary>With HACS (Recommended)</summary>

<br>

This method allows you to get updates directly on the Home Assistant Community Store

1. If HACS is not installed yet, download it following the instructions on [https://hacs.xyz/docs/use/download/download/](https://hacs.xyz/docs/use/download/download/)
2. Proceed to the HACS initial configuration following the instructions on [https://hacs.xyz/docs/configuration/basic](https://hacs.xyz/docs/configuration/basic)
3. On your sidebar go to "HACS"
4. Click on the blue button below (or add `https://github.com/PrimusNZ/shopping-mate-card` as a custom repository of type `Dashboard`)
5. Click on "Download"
6. Go back on your dashboard and click on the icon at the right top corner then on `Edit dashboard`
7. You can now click on `Add card` in the bottom right corner and search for `Shop List Card` or `Shop Calculator`

If it's not working, try to clear your browser/app cache (on all your devices if needed).

</details>

<br>

[![Open Shopping Mate Card on Home Assistant Community Store (HACS).](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=PrimusNZ&repository=shopping-mate-card&category=frontend)

<br>

## Setting up

Create these once, then add the cards.

**1. The shopping list.** Add a Local To-do list called **Shopping List**. Its entity is `todo.shopping_list`.

**2. The catalog (Shop List Card).** Add another Local To-do list called **Shop Catalog** (`todo.shop_catalog`). Each item in it is one thing you can buy, written as `Category: Item` or `Category: Item | Size`. See [Catalog format](#catalog-format). You can fill it by hand in the to-do list, or just use **+ Add New Item** in the card and it writes the entries for you.

**3. The history (Shop Calculator Card).**

- Add a Local Calendar called **Shop History** (`calendar.shop_history`). Each finished shop becomes an event here, with every item, quantity and price in the description.
- Add a **Number** helper called **Shop Spend Total** (`input_number.shop_spend_total`). Give it a minimum of 0, a maximum high enough for your yearly spending, and a step of 0.01. Finish shop adds each shop total to it. If you want weekly or monthly charts, mirror it with a total-increasing template sensor and use that in a statistics or history graph card.

**4. Add the cards.** Edit your dashboard, choose **Add card** and pick **Shop List Card** or **Shop Calculator**, then fill in the form. Or use YAML:

```yaml
type: custom:shop-list-card
entity: todo.shopping_list
catalog_entity: todo.shop_catalog
title: Shopping
```

```yaml
type: custom:shop-calc-card
entity: todo.shopping_list
calendar_entity: calendar.shop_history
spend_entity: input_number.shop_spend_total
currency: "$"
```

The calculator is best on its own phone view (a panel view works well) so it can fill the screen. The list card fills the height of its container, so give it a panel view or a full-height section as well. On the kiosk, put the list card in its own page.

**Optional: a notification when you finish.** The calculator saves the shop one minute in the future and bumps the spend counter. An automation that triggers when `input_number.shop_spend_total` goes up can read the newest event from `calendar.shop_history` and send you the receipt, for example to a phone or a family chat.

<br>

## Configuration

### Shop List Card

| Name | Type | Requirement | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | string | **Required** | | `custom:shop-list-card` |
| `entity` | string | Optional | `todo.shopping_list` | The to-do list that holds the shopping list. |
| `catalog_entity` | string | Optional | `todo.shop_catalog` | The to-do list that holds the catalog. |
| `title` | string | Optional | `Shopping` | Heading above the shopping list. Hidden on narrow screens, where the tabs take its place. |

### Shop Calculator Card

| Name | Type | Requirement | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | string | **Required** | | `custom:shop-calc-card` |
| `entity` | string | Optional | `todo.shopping_list` | The to-do list that holds the shopping list. |
| `calendar_entity` | string | Optional | `calendar.shop_history` | Calendar that receives one event per finished shop. |
| `spend_entity` | string | Optional | `input_number.shop_spend_total` | Number helper that the shop total is added to. |
| `currency` | string | Optional | `$` | Symbol shown before prices. |

<br>

## Catalog format

Each catalog entry is a single to-do item:

```text
Category: Item
Category: Item | Size or type
```

Examples:

```text
Dairy: Milk | 2L
Dairy: Milk | 3L
Pantry: Coffee | Granulated
Pantry: Coffee | Sachets
Pantry: Sugar
Gas & Fire: 9KG Gas Bottle
```

- An item with a size or type shows, and goes onto the shopping list, as `Item: Size` (Milk: 2L, Coffee: Sachets). Each size or type is its own item, so you can pick exactly the milk you want.
- The size or type is free text.
- An item name plus its size is unique across the whole catalog, whatever the category, and the match ignores capitals.
- Shopping list rows are stored as `Name` or `Name (3)`, with the quantity in brackets.

<br>

## Styling

The cards use your Home Assistant theme: `--secondary-background-color` for surfaces, `--primary-color` for accents and `--primary-text-color` / `--secondary-text-color` for text. The Shop List Card also reads these optional variables, which you can set with [card-mod](https://github.com/thomasloven/lovelace-card-mod) or a theme:

| Variable | Used for |
| --- | --- |
| `--kiosk-surface` | Panels, rows and buttons |
| `--kiosk-surface-edge` | Their outline or box-shadow |
| `--kiosk-accent` | Highlights, quantity badges, the selected tab |
| `--kiosk-text-primary` / `--kiosk-text-secondary` | Text |
| `--kiosk-background` | Dialog background |
| `--kiosk-viewport-content-height` | Card height (default: the screen height minus 120px, minimum 360px) |

The variable names come from the Kiosk dashboard these cards were first built for.

<br>

## Notes

- Key presses inside the Shop List Card do not bubble out of it, so a wrapping card that treats Space or Enter as a tap will not swallow what you type.
- The calculator keeps unfinished prices in the browser (local storage), per device. If you price items on a phone, finish the shop on that phone.
- Both cards need the Home Assistant to-do services (`todo.get_items`, `todo.add_item`, `todo.update_item`, `todo.remove_item`), which any to-do integration that supports editing provides.
- Built and tested on Home Assistant with Local To-do and Local Calendar, on a wall tablet and on phones. Other setups may need tweaks.

<br>

## License

Copyright © 2026 Ryan Davies (PrimusNZ).

This project is licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).

You are free to use, study, modify, and redistribute this project under the terms of the GNU GPL. Redistributed copies and derivative works must comply with the applicable GPL terms and must retain applicable copyright and license notices.

Ryan Davies (PrimusNZ) is the original author of this project. Contributors may identify and hold copyright in their own contributions, but redistribution must not remove or misrepresent the original project's applicable copyright and licensing notices.

See the [LICENSE](LICENSE) file for the complete GNU General Public License terms.
