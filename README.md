# OneTrade Options Risk Planner

A one-screen dark-mode calculator that sizes your options trades, shows risk–reward, and flags bad trades before you click “Buy”.

---

## Overview

**OneTrade Options Risk Planner** is a lightweight, single-page web app for **retail options traders** who want to control risk per trade without wrestling with complex spreadsheets or broker calculators.

You enter your account size, risk per trade, and basic trade details (entry, stop, target), and the app instantly shows:

- Recommended number of contracts
- Money at risk if your stop hits
- Potential profit at your target
- Risk–reward ratio
- A simple “Trade Quality” verdict (Pass / Caution / Risky)

Everything runs entirely in the browser — no login, no database, no backend.

---

## Why This Tool Matters

Retail traders globally are flocking to options markets, and listed options volumes have hit record levels for multiple years in a row.[web:1][web:5] At the same time, regulators and studies consistently show that **around 90% of retail derivatives traders lose money**, often due to poor risk management and overleveraging.[web:7][web:9][web:15]

Most traders have heard “risk 1–2% per trade,” but:

- They don’t have a fast, simple way to implement it.
- They often don’t know how many contracts to buy.
- They rarely see risk–reward and account impact on one screen.

**OneTrade** solves this by giving you a clean, mobile-friendly, dark-mode planner that acts as a **risk sanity check** before each trade.

---

## Features

- **Dark-mode, single-page web app**
  - Modern, responsive layout that works well on desktop and mobile.
- **Market presets**
  - US Options (100x), India Index Options (50x), or Custom multiplier and currency.
- **Flexible risk settings**
  - Risk per trade by percentage (e.g., 1%) or fixed amount (e.g., ₹1,000).
- **Core trade inputs**
  - Entry, stop-loss, target, direction (long/short), and optional fees per contract.
- **Instant risk metrics**
  - Allowed loss, risk per contract, suggested contracts, capital used, estimated loss/profit, risk as % of account, and approximate breakeven price.
- **Risk–Reward verdict**
  - Simple verdict box with traffic-light colors (Good / Caution / Risky) and a checklist of suggestions.
- **Local trade journal**
  - Save snapshots in your browser (localStorage) and copy neatly formatted summaries.
- **Totally offline**
  - Static HTML/CSS/JS, no backend, no cookies, no tracking.
