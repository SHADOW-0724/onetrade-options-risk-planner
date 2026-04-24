// script.js

// Helper: format number with currency symbol
function formatMoney(value, currencySymbol) {
  if (isNaN(value)) return '-';
  const rounded = Math.round(value * 100) / 100;
  return `${currencySymbol}${rounded.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Helper: format percentage
function formatPercent(value) {
  if (isNaN(value)) return '-';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}%`;
}

// Save and load basic preferences (market preset, multiplier, currency)
function loadPreferences() {
  try {
    const raw = localStorage.getItem('oneTradePrefs');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function savePreferences(prefs) {
  try {
    localStorage.setItem('oneTradePrefs', JSON.stringify(prefs));
  } catch (e) {
    // ignore storage errors
  }
}

// Snapshot journal helpers
function loadSnapshots() {
  try {
    const raw = localStorage.getItem('oneTradeSnapshots');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveSnapshots(list) {
  try {
    localStorage.setItem('oneTradeSnapshots', JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const marketPresetEl = document.getElementById('marketPreset');
  const contractMultiplierEl = document.getElementById('contractMultiplier');
  const currencySymbolEl = document.getElementById('currencySymbol');
  const accountSizeEl = document.getElementById('accountSize');
  const riskPercentEl = document.getElementById('riskPercent');
  const riskFixedEl = document.getElementById('riskFixed');
  const entryPriceEl = document.getElementById('entryPrice');
  const stopPriceEl = document.getElementById('stopPrice');
  const targetPriceEl = document.getElementById('targetPrice');
  const feesPerContractEl = document.getElementById('feesPerContract');
  const tradeDirectionEl = document.getElementById('tradeDirection');

  const errorBox = document.getElementById('errorBox');
  const resultsBox = document.getElementById('resultsBox');
  const verdictBox = document.getElementById('verdictBox');
  const verdictBadge = document.getElementById('verdictBadge');
  const verdictText = document.getElementById('verdictText');
  const verdictChecklist = document.getElementById('verdictChecklist');

  const allowedLossValue = document.getElementById('allowedLossValue');
  const allowedLossNote = document.getElementById('allowedLossNote');
  const riskPerContractValue = document.getElementById('riskPerContractValue');
  const contractsValue = document.getElementById('contractsValue');
  const contractsNote = document.getElementById('contractsNote');
  const capitalUsedValue = document.getElementById('capitalUsedValue');
  const lossAtStopValue = document.getElementById('lossAtStopValue');
  const profitAtTargetValue = document.getElementById('profitAtTargetValue');
  const riskPercentOfAccountValue = document.getElementById('riskPercentOfAccountValue');
  const rrRatioValue = document.getElementById('rrRatioValue');
  const breakevenValue = document.getElementById('breakevenValue');

  const calculateBtn = document.getElementById('calculateBtn');
  const resetBtn = document.getElementById('resetBtn');

  const snapshotActions = document.getElementById('snapshotActions');
  const saveSnapshotBtn = document.getElementById('saveSnapshotBtn');
  const clearSnapshotsBtn = document.getElementById('clearSnapshotsBtn');
  const snapshotsList = document.getElementById('snapshotsList');

  const donateLink = document.getElementById('donateLink');
  const proGuideLink = document.getElementById('proGuideLink');
  const donateLinkSecondary = document.getElementById('donateLinkSecondary');
  const proGuideLinkSecondary = document.getElementById('proGuideLinkSecondary');

  // ---- Configure payment / upsell links (placeholders for you to edit) ----
  const DONATION_URL = '#'; // e.g. https://www.buymeacoffee.com/yourname
  const PRO_GUIDE_URL = '#'; // e.g. https://your-gumroad-link

  donateLink.href = DONATION_URL;
  donateLinkSecondary.href = DONATION_URL;
  proGuideLink.href = PRO_GUIDE_URL;
  proGuideLinkSecondary.href = PRO_GUIDE_URL;

  // Load preferences (if any)
  const prefs = loadPreferences();
  if (prefs) {
    if (prefs.marketPreset) marketPresetEl.value = prefs.marketPreset;
    if (typeof prefs.contractMultiplier === 'number') {
      contractMultiplierEl.value = String(prefs.contractMultiplier);
    }
    if (prefs.currencySymbol) currencySymbolEl.value = prefs.currencySymbol;
  }

  // Apply preset when changed
  function applyPreset(preset) {
    if (preset === 'us') {
      contractMultiplierEl.value = '100';
      currencySymbolEl.value = '$';
    } else if (preset === 'india') {
      contractMultiplierEl.value = '50';
      currencySymbolEl.value = '₹';
    } else {
      // custom: keep user values
    }
  }

  marketPresetEl.addEventListener('change', () => {
    applyPreset(marketPresetEl.value);
    savePreferences({
      marketPreset: marketPresetEl.value,
      contractMultiplier: Number(contractMultiplierEl.value) || 100,
      currencySymbol: currencySymbolEl.value || '$'
    });
  });

  contractMultiplierEl.addEventListener('change', () => {
    savePreferences({
      marketPreset: marketPresetEl.value,
      contractMultiplier: Number(contractMultiplierEl.value) || 100,
      currencySymbol: currencySymbolEl.value || '$'
    });
  });

  currencySymbolEl.addEventListener('input', () => {
    savePreferences({
      marketPreset: marketPresetEl.value,
      contractMultiplier: Number(contractMultiplierEl.value) || 100,
      currencySymbol: currencySymbolEl.value || '$'
    });
  });

  // Initial preset application
  applyPreset(marketPresetEl.value);

  // Show / hide error box
  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  // Clear results
  function clearResults() {
    resultsBox.classList.add('hidden');
    verdictBox.classList.add('hidden');
    snapshotActions.classList.add('hidden');
  }

  resetBtn.addEventListener('click', () => {
    accountSizeEl.value = '';
    riskPercentEl.value = '';
    riskFixedEl.value = '';
    entryPriceEl.value = '';
    stopPriceEl.value = '';
    targetPriceEl.value = '';
    feesPerContractEl.value = '';
    tradeDirectionEl.value = 'long';
    clearError();
    clearResults();
  });

  // Core calculation logic
  calculateBtn.addEventListener('click', () => {
    clearError();

    const currencySymbol = (currencySymbolEl.value || '$').trim() || '$';
    const accountSize = Number(accountSizeEl.value);
    const riskPercent = riskPercentEl.value ? Number(riskPercentEl.value) : null;
    const riskFixed = riskFixedEl.value ? Number(riskFixedEl.value) : null;
    const entryPrice = Number(entryPriceEl.value);
    const stopPrice = Number(stopPriceEl.value);
    const targetPrice = Number(targetPriceEl.value);
    const feesPerContract = feesPerContractEl.value ? Number(feesPerContractEl.value) : 0;
    const direction = tradeDirectionEl.value; // 'long' or 'short'
    const multiplier = Number(contractMultiplierEl.value) || 100;

    const errors = [];

    if (!(accountSize > 0)) errors.push('Please enter a valid account size.');
    if (!(entryPrice > 0)) errors.push('Please enter a valid entry price.');
    if (!(stopPrice >= 0)) errors.push('Please enter a valid stop-loss price.');
    if (!(targetPrice > 0)) errors.push('Please enter a valid target price.');
    if (!riskPercent && !riskFixed) {
      errors.push('Specify either risk % or fixed risk amount.');
    }
    if (riskPercent !== null && riskPercent <= 0) {
      errors.push('Risk percentage must be greater than 0.');
    }
    if (riskFixed !== null && riskFixed <= 0) {
      errors.push('Fixed risk amount must be greater than 0.');
    }
    if (feesPerContract < 0) {
      errors.push('Fees per contract cannot be negative.');
    }

    if (errors.length) {
      showError(errors.join(' '));
      clearResults();
      return;
    }

    // Determine allowed loss amount
    let allowedLoss;
    let usedRiskPercent = riskPercent;
    if (riskFixed !== null && riskFixed > 0) {
      allowedLoss = riskFixed;
      usedRiskPercent = (riskFixed / accountSize) * 100;
    } else {
      allowedLoss = (accountSize * riskPercent) / 100;
    }

    // For long trades: risk per contract is entry - stop (must be positive)
    // For short trades: risk per contract is stop - entry
    let riskPerUnit =
      direction === 'long' ? entryPrice - stopPrice : stopPrice - entryPrice;

    if (riskPerUnit <= 0) {
      showError(
        'Your stop-loss is on the wrong side of entry for this direction. For long trades, stop must be below entry; for short trades, above.'
      );
      clearResults();
      return;
    }

    // Profit per contract: difference between target and entry, adjusted for direction
    let profitPerUnit =
      direction === 'long' ? targetPrice - entryPrice : entryPrice - targetPrice;

    if (profitPerUnit <= 0) {
      showError(
        'Your target does not offer any profit relative to entry for this direction. Adjust target price.'
      );
      clearResults();
      return;
    }

    // Adjust by multiplier to get per-contract figures
    const riskPerContract = riskPerUnit * multiplier;
    const profitPerContract = profitPerUnit * multiplier;

    if (riskPerContract <= 0) {
      showError('Calculated risk per contract is not valid. Please check your inputs.');
      clearResults();
      return;
    }

    // Recommended contracts based purely on risk
    const riskContracts = Math.floor(allowedLoss / riskPerContract);
    const recommendedContracts = Math.max(riskContracts, 0);

    // Capital used (approx entry * multiplier * contracts)
    const capitalUsed = entryPrice * multiplier * recommendedContracts;

    // Estimated loss / profit including fees (fees apply per contract, both sides)
    const totalFees = feesPerContract * recommendedContracts;
    const lossAtStop = riskPerContract * recommendedContracts + totalFees;
    const profitAtTarget = profitPerContract * recommendedContracts - totalFees;

    const riskPercentOfAccount = (lossAtStop / accountSize) * 100;

    const rrRatio =
      lossAtStop > 0 ? profitAtTarget / lossAtStop : NaN;

    // Breakeven estimate: entry +/- fees impact per unit
    const feesPerUnit = multiplier > 0 ? feesPerContract / multiplier : 0;
    const breakeven =
      direction === 'long'
        ? entryPrice + feesPerUnit
        : entryPrice - feesPerUnit;

    // ---- Update results UI ----
    allowedLossValue.textContent = formatMoney(allowedLoss, currencySymbol);
    allowedLossNote.textContent = `≈ ${formatPercent(usedRiskPercent || 0)} of account`;

    riskPerContractValue.textContent = formatMoney(riskPerContract, currencySymbol);
    contractsValue.textContent = recommendedContracts.toString();

    if (recommendedContracts === 0) {
      contractsNote.textContent =
        'Warning: Risk per contract is larger than your allowed loss. Consider widening stop, reducing risk, or skipping the trade.';
    } else {
      contractsNote.textContent =
        'Contracts based on risk only (ignores broker margin limits).';
    }

    capitalUsedValue.textContent = formatMoney(capitalUsed, currencySymbol);
    lossAtStopValue.textContent = formatMoney(lossAtStop, currencySymbol);
    profitAtTargetValue.textContent = formatMoney(profitAtTarget, currencySymbol);
    riskPercentOfAccountValue.textContent = formatPercent(riskPercentOfAccount);
    rrRatioValue.textContent = isNaN(rrRatio)
      ? '-'
      : `1 : ${Math.round(rrRatio * 10) / 10}`;
    breakevenValue.textContent = formatMoney(breakeven, currencySymbol);

    resultsBox.classList.remove('hidden');
    snapshotActions.classList.remove('hidden');

    // ---- Verdict logic ----
    verdictChecklist.innerHTML = '';
    verdictBox.classList.remove('hidden', 'verdict-good', 'verdict-caution', 'verdict-bad');

    const checklistItems = [];

    if (riskPercentOfAccount <= 2 && rrRatio >= 2 && recommendedContracts > 0) {
      verdictBox.classList.add('verdict-good');
      verdictBadge.textContent = 'Trade looks solid';
      verdictText.textContent =
        'You are risking a small fraction of your account for a strong potential reward. This trade passes basic risk checks.';
    } else if (
      riskPercentOfAccount <= 3 &&
      rrRatio >= 1.5 &&
      recommendedContracts > 0
    ) {
      verdictBox.classList.add('verdict-caution');
      verdictBadge.textContent = 'Needs caution';
      verdictText.textContent =
        'This trade is acceptable but not ideal. Check if you can improve entries, tighten stops, or reduce size.';
    } else {
      verdictBox.classList.add('verdict-bad');
      verdictBadge.textContent = 'Risky / Poor R:R';
      verdictText.textContent =
        'This trade fails basic risk checks. Consider skipping, reducing size, or adjusting your levels.';
    }

    if (riskPercentOfAccount > 3) {
      checklistItems.push(
        `Risk per trade is ${formatPercent(
          riskPercentOfAccount
        )} — consider lowering position size.`
      );
    } else {
      checklistItems.push(
        `Risk per trade is ${formatPercent(
          riskPercentOfAccount
        )} — within a common 1–3% guideline.`
      );
    }

    if (rrRatio < 1.5) {
      checklistItems.push(
        'Risk–reward is below 1:1.5 — consider improving entry or target.'
      );
    } else if (rrRatio < 2) {
      checklistItems.push('Risk–reward is between 1:1.5 and 1:2 — borderline but usable.');
    } else {
      checklistItems.push('Risk–reward is ≥ 1:2 — strong asymmetric payoff.');
    }

    if (recommendedContracts === 0) {
      checklistItems.push(
        'With your current stop and risk settings, even 1 contract is too large. Either reduce risk or adjust stop/entry.'
      );
    } else {
      checklistItems.push(
        `Max contracts based on your rules: ${recommendedContracts}. Avoid rounding up beyond this.`
      );
    }

    if (feesPerContract > 0) {
      checklistItems.push(
        'Fees are included in loss/profit estimates. Very high fees can quickly eat into your edge.'
      );
    } else {
      checklistItems.push(
        'Consider adding approximate fees to get more realistic risk–reward numbers.'
      );
    }

    checklistItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      verdictChecklist.appendChild(li);
    });

    // Save the latest computed data for snapshot creation
    const latestCalculation = {
      timestamp: new Date().toISOString(),
      direction,
      entryPrice,
      stopPrice,
      targetPrice,
      accountSize,
      usedRiskPercent,
      allowedLoss,
      riskPerContract,
      recommendedContracts,
      lossAtStop,
      profitAtTarget,
      riskPercentOfAccount,
      rrRatio,
      currencySymbol
    };
    window._oneTradeLatest = latestCalculation;
  });

  // Render snapshots list
  function renderSnapshots() {
    const snapshots = loadSnapshots();
    snapshotsList.innerHTML = '';

    if (!snapshots.length) {
      snapshotsList.classList.add('empty-state');
      snapshotsList.textContent =
        'No snapshots yet. Calculate a trade and click “Save Snapshot”.';
      return;
    }

    snapshotsList.classList.remove('empty-state');

    snapshots.forEach((snap, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'snapshot-item';

      const header = document.createElement('div');
      header.className = 'snapshot-header';

      const title = document.createElement('span');
      title.className = 'snapshot-title';
      title.textContent = `Trade ${snap.direction.toUpperCase()} @ ${snap.entry} (${snap.contracts}x)`;

      const time = document.createElement('span');
      time.className = 'snapshot-time';
      const date = new Date(snap.timestamp);
      time.textContent = date.toLocaleString();

      header.appendChild(title);
      header.appendChild(time);

      const body = document.createElement('div');
      body.className = 'snapshot-body';
      body.innerHTML = `
        Risk: ${formatMoney(snap.lossAtStop, snap.currency)} (${formatPercent(
        snap.riskPercent
      )})<br/>
        R:R: ${snap.rrText}<br/>
        Levels: SL ${snap.stop} · TGT ${snap.target}
      `;

      // Simple "copy summary" button
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn-outline small';
      copyBtn.textContent = 'Copy summary';
      copyBtn.style.marginTop = '4px';
      copyBtn.addEventListener('click', () => {
        const summary = `OneTrade snapshot:
Direction: ${snap.direction}
Entry: ${snap.entry}
Stop: ${snap.stop}
Target: ${snap.target}
Contracts: ${snap.contracts}
Estimated risk: ${formatMoney(snap.lossAtStop, snap.currency)} (${formatPercent(
          snap.riskPercent
        )})
Risk–Reward: ${snap.rrText}
Time: ${date.toLocaleString()}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(summary).catch(() => {});
        } else {
          // Fallback: prompt user
          window.prompt('Copy snapshot summary:', summary);
        }
      });

      body.appendChild(copyBtn);

      wrapper.appendChild(header);
      wrapper.appendChild(body);

      snapshotsList.appendChild(wrapper);
    });
  }

  // Initialize snapshots on load
  renderSnapshots();

  // Snapshot saving
  saveSnapshotBtn.addEventListener('click', () => {
    const latest = window._oneTradeLatest;
    if (!latest) {
      return;
    }

    const snapshots = loadSnapshots();

    const rrText = isNaN(latest.rrRatio)
      ? '-'
      : `1 : ${Math.round(latest.rrRatio * 10) / 10}`;

    const snapshot = {
      timestamp: latest.timestamp,
      direction: latest.direction,
      entry: latest.entryPrice,
      stop: latest.stopPrice,
      target: latest.targetPrice,
      contracts: latest.recommendedContracts,
      lossAtStop: latest.lossAtStop,
      riskPercent: latest.riskPercentOfAccount,
      rrText,
      currency: latest.currencySymbol
    };

    snapshots.unshift(snapshot);
    saveSnapshots(snapshots);
    renderSnapshots();
  });

  clearSnapshotsBtn.addEventListener('click', () => {
    if (!confirm('Clear all saved snapshots from this browser?')) return;
    saveSnapshots([]);
    renderSnapshots();
  });
});