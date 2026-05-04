(function () {
  "use strict";

  const STORE_KEY = "salt-v4-state";
  const ANSWER_CODE_PREFIX_AES = "SALT1A.";
  const ANSWER_CODE_PREFIX_XOR = "SALT1X.";
  const ANSWER_CODE_KEY = "SALT v4 local answer code key";
  const DEFAULT_ROLE_AFFINITY_LABEL = "与你的依恋模式相仿的人是：";
  const CODES = [
    "S+A+L+T+",
    "S+A+L+T-",
    "S+A+L-T+",
    "S+A+L-T-",
    "S+A-L+T+",
    "S+A-L+T-",
    "S+A-L-T+",
    "S+A-L-T-",
    "S-A+L+T+",
    "S-A+L+T-",
    "S-A+L-T+",
    "S-A+L-T-",
    "S-A-L+T+",
    "S-A-L+T-",
    "S-A-L-T+",
    "S-A-L-T-"
  ];
  const DISPLAY_LETTERS = {
    S: { "+": "U", "-": "O" },
    A: { "+": "D", "-": "I" },
    L: { "+": "R", "-": "N" },
    T: { "+": "M", "-": "X" }
  };

  const FALLBACK_TITLES = {
    "S+A+L+T+": "誓约同行型",
    "S+A+L+T-": "宿命执念型",
    "S+A+L-T+": "热烈护主型",
    "S+A+L-T-": "占有冲锋型",
    "S+A-L+T+": "沉默守候型",
    "S+A-L+T-": "破碎宿命型",
    "S+A-L-T+": "别扭撒娇型",
    "S+A-L-T-": "逃跑猫猫型",
    "S-A+L+T+": "稳定同行型",
    "S-A+L+T-": "孤独执行者型",
    "S-A+L-T+": "轻松搭子型",
    "S-A+L-T-": "随缘行动型",
    "S-A-L+T+": "旧人同路型",
    "S-A-L+T-": "远方投射型",
    "S-A-L-T+": "舒服同好型",
    "S-A-L-T-": "断线自由型"
  };

  const DEFAULT_ART_MANIFEST = {
    backgrounds: { default: "", result: "" },
    avatars: { default: "", S_plus: "", A_plus: "", L_plus: "", T_plus: "" },
    badges: {
      specialness: "",
      action: "",
      long_range: "",
      two_wayness: "",
      practical: "",
      emotional: "",
      creative: "",
      presence: ""
    },
    result_cards: { default: "" },
    type_illustrations: CODES.reduce((items, code) => {
      items[code] = "";
      return items;
    }, {})
  };

  const DEFAULT_SUPPORT_DATA = {
    profiles: {
      practical: {
        label: "实用托底",
        badge: "practical",
        channel: "现实问题被推进",
        description: "你会通过资源、行动和具体解决感到被托住。"
      },
      emotional: {
        label: "情绪理解",
        badge: "emotional",
        channel: "情绪先被接住",
        description: "你会通过倾听、理解和不急着评判感到安全。"
      },
      creative: {
        label: "共同创作",
        badge: "creative",
        channel: "一起做出具体的东西",
        description: "你会通过对方认真参与兴趣、作品或创作感到被看见。"
      },
      presence: {
        label: "低压在场",
        badge: "presence",
        channel: "稳定低压地待在一起",
        description: "你会通过不压迫的陪伴和稳定出现感到安心。"
      }
    }
  };

  let artManifest = mergeManifest(DEFAULT_ART_MANIFEST, window.SALT_ART_MANIFEST_DATA || {});
  let toastTimer = 0;
  let roleArtItems = [];
  let roleArtIndex = 0;
  let roleArtTimer = 0;
  let roleArtFadeTimer = 0;
  let roleAffinityLabel = DEFAULT_ROLE_AFFINITY_LABEL;
  let lastResultData = null;
  let autoAdvanceTimer = 0;
  let resultRoleSwipe = null;

  const questions = window.SALT_QUESTIONS || { main: [], support: [], all: [], scale: [] };
  const allQuestions = questions.all || (questions.main || []).concat(questions.support || []);
  const scale = questions.scale || [];
  const resultTypes = normalizeResultTypes(window.SALT_RESULT_TYPES_DATA || window.SALT_RESULT_TYPES || {});
  const resultProfiles = normalizeResultProfiles(window.SALT_RESULT_PROFILES_DATA || window.SALT_RESULT_PROFILES || {});
  const roleImages = normalizeRoleImages(window.SALT_ROLE_IMAGES_DATA || {});
  const supportProfiles = normalizeSupportProfiles(window.SALT_SUPPORT_PROFILES_DATA || window.SALT_SUPPORT_PROFILES || DEFAULT_SUPPORT_DATA);
  let state = loadState();

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    sanitizeState();
    loadArtManifest();
    render();
  }

  function cacheElements() {
    els.backgroundArt = document.getElementById("backgroundArt");
    els.questionCount = document.getElementById("questionCount");
    els.progressFill = document.getElementById("progressFill");
    els.introPanel = document.getElementById("introPanel");
    els.startButton = document.getElementById("startButton");
    els.introRoleGrid = document.getElementById("introRoleGrid");
    els.quizPanel = document.getElementById("quizPanel");
    els.resultPanel = document.getElementById("resultPanel");
    els.questionText = document.getElementById("questionText");
    els.optionGrid = document.getElementById("optionGrid");
    els.backButton = document.getElementById("backButton");
    els.restartQuizButton = document.getElementById("restartQuizButton");
    els.restartTopButton = document.getElementById("restartTopButton");
    els.restartResultButton = document.getElementById("restartResultButton");
    els.resultBackButton = document.getElementById("resultBackButton");
    els.copyButton = document.getElementById("copyButton");
    els.saveImageButton = document.getElementById("saveImageButton");
    els.saveImageTopButton = document.getElementById("saveImageTopButton");
    els.shareButton = document.getElementById("shareButton");
    els.toggleAnswerCodeButton = document.getElementById("toggleAnswerCodeButton");
    els.decodeToggleButton = document.getElementById("decodeToggleButton");
    els.decodeButton = document.getElementById("decodeButton");
    els.resultCode = document.getElementById("resultCode");
    els.resultLegacyCode = document.getElementById("resultLegacyCode");
    els.resultTitle = document.getElementById("resultTitle");
    els.resultDescription = document.getElementById("resultDescription");
    els.resultTagline = document.getElementById("resultTagline");
    els.resultRoles = document.getElementById("resultRoles");
    els.resultModeGrid = document.getElementById("resultModeGrid");
    els.typeLayerGrid = document.getElementById("typeLayerGrid");
    els.scoreList = document.getElementById("scoreList");
    els.selfScoreList = document.getElementById("selfScoreList");
    els.comparisonList = document.getElementById("comparisonList");
    els.gapCard = document.getElementById("gapCard");
    els.supportRanking = document.getElementById("supportRanking");
    els.supportAnalysis = document.getElementById("supportAnalysis");
    els.profileSection = document.getElementById("profileSection");
    els.profileGrid = document.getElementById("profileGrid");
    els.answerCodeText = document.getElementById("answerCodeText");
    els.decoderPanel = document.getElementById("decoderPanel");
    els.answerCodeInput = document.getElementById("answerCodeInput");
    els.decodeOutput = document.getElementById("decodeOutput");
    els.resultAvatarImage = document.getElementById("resultAvatarImage");
    els.resultAvatarFallback = document.getElementById("resultAvatarFallback");
    els.artWindow = document.getElementById("artWindow");
    els.sideArtImage = document.getElementById("sideArtImage");
    els.artPlaceholder = document.getElementById("artPlaceholder");
    els.roleArtMeta = document.getElementById("roleArtMeta");
    els.roleArtName = document.getElementById("roleArtName");
    els.roleArtSwitch = document.getElementById("roleArtSwitch");
    els.toast = document.getElementById("toast");
  }

  function bindEvents() {
    els.optionGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-value]");
      if (!button) return;
      selectAnswer(Number(button.dataset.value));
    });

    if (els.startButton) els.startButton.addEventListener("click", startQuiz);
    els.backButton.addEventListener("click", goBack);
    if (els.restartQuizButton) els.restartQuizButton.addEventListener("click", restart);
    els.resultBackButton.addEventListener("click", () => {
      state.mode = "quiz";
      state.current = Math.max(0, allQuestions.length - 1);
      saveState();
      render();
    });
    els.restartTopButton.addEventListener("click", restart);
    els.restartResultButton.addEventListener("click", restart);
    els.copyButton.addEventListener("click", copyResult);
    els.saveImageButton.addEventListener("click", saveResultImage);
    if (els.saveImageTopButton) els.saveImageTopButton.addEventListener("click", saveResultImage);
    els.shareButton.addEventListener("click", shareResult);
    els.toggleAnswerCodeButton.addEventListener("click", toggleAnswerCode);
    els.decodeToggleButton.addEventListener("click", toggleDecoder);
    els.decodeButton.addEventListener("click", decodeAnswerCodeFromPanel);
    els.artWindow.addEventListener("click", () => {
      if (roleArtItems.length > 1) showNextRoleArt(true);
    });
    els.roleArtSwitch.addEventListener("click", (event) => {
      event.stopPropagation();
      if (roleArtItems.length > 1) showNextRoleArt(true);
    });

    document.addEventListener("keydown", handleKeydown);
  }

  function handleKeydown(event) {
    const tag = String((event.target && event.target.tagName) || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    if (/^[1-5]$/.test(event.key) && state.mode === "quiz") {
      event.preventDefault();
      const option = scale[Number(event.key) - 1];
      if (option) selectAnswer(option.value);
      return;
    }

    if (event.key === "Enter" && state.mode === "intro") {
      event.preventDefault();
      startQuiz();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      goBack();
    }
  }

  function loadArtManifest() {
    artManifest = mergeManifest(DEFAULT_ART_MANIFEST, window.SALT_ART_MANIFEST_DATA || {});
    return artManifest;
  }

  function getArtAsset(category, key, fallback = "") {
    const group = artManifest && artManifest[category];
    if (!group || !Object.prototype.hasOwnProperty.call(group, key)) return fallback;
    return group[key] || fallback;
  }

  function render() {
    const complete = isComplete();
    if (state.mode === "result" && complete) {
      renderResult();
      return;
    }
    if (state.mode === "intro") {
      renderIntro();
      return;
    }
    state.mode = "quiz";
    renderQuestion();
  }

  function renderIntro() {
    document.body.dataset.screen = "intro";
    if (els.introPanel) els.introPanel.classList.remove("hidden");
    els.quizPanel.classList.add("hidden");
    els.resultPanel.classList.add("hidden");
    applyBackground("default");
    applySideArt("default");
    updateProgress(false, 0);
    if (els.introRoleGrid && !els.introRoleGrid.dataset.ready) {
      els.introRoleGrid.innerHTML = renderIntroRoles();
      hydrateIntroImages(els.introRoleGrid);
      els.introRoleGrid.dataset.ready = "true";
    }
  }

  function renderQuestion() {
    ensureQuestionOrder();
    const question = currentQuestion();
    const selected = question ? state.answers[question.id] : undefined;

    document.body.dataset.screen = "quiz";
    if (els.introPanel) els.introPanel.classList.add("hidden");
    els.quizPanel.classList.remove("hidden");
    els.resultPanel.classList.add("hidden");
    applyBackground("default");
    applySideArt("default");

    updateProgress();
    els.backButton.disabled = false;
    if (!question) {
      els.questionText.textContent = "请检查 questions.js。";
      els.optionGrid.innerHTML = "";
      return;
    }

    els.questionText.textContent = question.text;
    els.optionGrid.innerHTML = scale.map((option) => {
      const selectedClass = Number(selected) === option.value ? " selected" : "";
      return [
        `<button class="option-button${selectedClass}" type="button" data-value="${option.value}" aria-pressed="${selectedClass ? "true" : "false"}">`,
        `<span class="option-label">${escapeHtml(option.label)}</span>`,
        "</button>"
      ].join("");
    }).join("");
  }

  function renderResult() {
    const result = calculateResult();
    lastResultData = result;
    const partnerType = getType(result.partnerCode);
    const partnerProfile = getProfile(result.partnerCode);
    const partnerRoles = rolesForType(partnerType);
    const partnerRoleLabel = "与你期待的伴侣模式相仿的人是：";

    document.body.dataset.screen = "result";
    if (els.introPanel) els.introPanel.classList.add("hidden");
    els.quizPanel.classList.add("hidden");
    els.resultPanel.classList.remove("hidden");
    applyBackground("result");
    updateProgress(true);

    if (els.resultModeGrid) {
      els.resultModeGrid.innerHTML = renderResultModeCards(result);
      hydrateResultModeImages(els.resultModeGrid);
      bindResultRoleSwipe(els.resultModeGrid);
    }
    if (els.resultCode) els.resultCode.textContent = result.partnerDisplayCode;
    if (els.resultLegacyCode) els.resultLegacyCode.textContent = `SALT：${result.partnerCode}`;
    if (els.resultTitle) els.resultTitle.textContent = partnerType.title;
    if (els.resultDescription) els.resultDescription.textContent = partnerType.description || "这个类型还没有描述，可以在 data/result_types.json 中补充。";
    if (els.resultTagline) {
      els.resultTagline.textContent = partnerProfile.partner_expectation || partnerProfile.tagline || "";
      els.resultTagline.classList.toggle("hidden", !els.resultTagline.textContent);
    }
    renderRoleAffinity(primaryCharacter(partnerType), partnerRoleLabel);
    setupRoleArt(partnerRoles, result, partnerRoleLabel);
    setMainAvatar(partnerType, result.partnerCode, result);

    if (els.typeLayerGrid) {
      els.typeLayerGrid.innerHTML = "";
    }
    els.scoreList.innerHTML = renderScoreRows(result, "partner");
    if (els.selfScoreList) els.selfScoreList.innerHTML = renderScoreRows(result, "self");
    els.comparisonList.innerHTML = renderComparisonRows(result);
    els.gapCard.innerHTML = renderGapCard(result);
    els.supportRanking.innerHTML = renderSupportRanking(result.supportRanking);
    els.supportAnalysis.textContent = getSupportAnalysis(result.supportRanking);
    renderResultProfile(result);
    renderAnswerCode(result);
  }

  function renderIntroRoles() {
    const cards = getIntroRoleItems().map((item) => {
      return [
        '<article class="intro-role-card">',
        '<div class="intro-role-art">',
        item.image ? `<img src="${escapeAttribute(item.image)}" alt="">` : "",
        '<span class="intro-role-fallback">SALT</span>',
        "</div>",
        '<div class="intro-role-copy">',
        `<span class="intro-role-display-code">${escapeHtml(item.displayCode)}</span>`,
        `<strong>${escapeHtml(item.title)}</strong>`,
        `<p>${escapeHtml(item.role)}</p>`,
        `<em>SALT：${escapeHtml(item.code)}</em>`,
        "</div>",
        "</article>"
      ].join("");
    }).join("");
    const duplicateCards = cards.replaceAll('<article class="intro-role-card">', '<article class="intro-role-card" aria-hidden="true">');
    return [
      '<div class="intro-role-track">',
      cards,
      duplicateCards,
      "</div>"
    ].join("");
  }

  function getIntroRoleItems() {
    const seen = new Set();
    return CODES.flatMap((code) => {
      const type = getType(code);
      return rolesForType(type).map((role) => {
        const key = `${normalizeRoleName(role)}|${code}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          code,
          displayCode: displayCodeForCode(code),
          title: type.title,
          role,
          image: getRoleImage(role) || getTypeIllustration(type, code)
        };
      }).filter(Boolean);
    });
  }

  function hydrateIntroImages(root) {
    root.querySelectorAll(".intro-role-art img").forEach((image) => {
      const fallback = image.nextElementSibling;
      image.addEventListener("load", () => {
        image.classList.add("loaded");
        if (fallback) fallback.classList.add("hidden");
      });
      image.addEventListener("error", () => {
        image.classList.add("hidden");
        if (fallback) fallback.classList.remove("hidden");
      });
      if (image.complete && image.naturalWidth > 0) {
        image.classList.add("loaded");
        if (fallback) fallback.classList.add("hidden");
      }
    });
  }

  function renderResultModeCards(result) {
    const partnerType = getType(result.partnerCode);
    const selfType = getType(result.selfCode);
    const partnerProfile = getProfile(result.partnerCode);
    const selfProfile = getProfile(result.selfCode);
    const partnerGallery = getRoleGallery(partnerType, result.partnerCode);
    const selfGallery = getRoleGallery(selfType, result.selfCode);
    const partnerRole = getSelectedRoleItem(result.partnerCode, partnerGallery);
    const selfRole = getSelectedRoleItem(result.selfCode, selfGallery);
    return [
      renderResultModeCard({
        kind: "partner",
        label: "你希望伴侣的依恋模式",
        code: result.partnerCode,
        displayCode: result.partnerDisplayCode,
        type: partnerType,
        description: partnerType.description,
        paragraph: partnerProfile.partner_expectation || partnerProfile.tagline,
        roles: resultModeRoleText(partnerType, partnerGallery, partnerRole),
        image: partnerRole ? partnerRole.src : getTypeIllustration(partnerType, result.partnerCode),
        gallery: partnerGallery,
        selectedRole: partnerRole
      }),
      renderResultModeCard({
        kind: "self",
        label: "你自己的依恋模式",
        code: result.selfCode,
        displayCode: result.selfDisplayCode,
        type: selfType,
        description: selfType.description,
        paragraph: selfProfile.self_attachment || selfProfile.tagline,
        roles: resultModeRoleText(selfType, selfGallery, selfRole),
        image: selfRole ? selfRole.src : getTypeIllustration(selfType, result.selfCode),
        gallery: selfGallery,
        selectedRole: selfRole
      })
    ].join("");
  }

  function renderResultModeCard(card) {
    const gallery = Array.isArray(card.gallery) ? card.gallery : [];
    const selectedIndex = card.selectedRole ? gallery.findIndex((item) => item.role === card.selectedRole.role) : 0;
    const hasRoleSwitch = gallery.length > 1;
    return [
      `<article class="result-mode-card ${escapeAttribute(card.kind)}" data-code="${escapeAttribute(card.code)}" data-role-index="${Math.max(0, selectedIndex)}">`,
      `<div class="result-mode-art" data-gallery="${hasRoleSwitch ? "true" : "false"}" aria-label="${hasRoleSwitch ? "左右滑动切换展示人物" : "结果立绘"}">`,
      card.image ? `<img src="${escapeAttribute(card.image)}" alt="">` : "",
      '<span class="result-mode-fallback">SALT</span>',
      hasRoleSwitch ? `<span class="result-role-switch-hint">${escapeHtml(roleSwitchHint(Math.max(0, selectedIndex), gallery.length))}</span>` : "",
      "</div>",
      '<div class="result-mode-body">',
      `<p class="panel-kicker">${escapeHtml(card.label)}</p>`,
      `<h2>${escapeHtml(card.type.title)}</h2>`,
      '<div class="result-mode-code-row">',
      `<strong>${escapeHtml(card.displayCode)}</strong>`,
      `<span>SALT：${escapeHtml(card.code)}</span>`,
      "</div>",
      card.description ? `<p class="result-mode-description">${escapeHtml(card.description)}</p>` : "",
      card.roles ? `<p class="result-mode-roles">角色参考：${escapeHtml(card.roles)}</p>` : "",
      card.paragraph ? `<p class="result-mode-paragraph">${escapeHtml(card.paragraph)}</p>` : "",
      "</div>",
      "</article>"
    ].join("");
  }

  function hydrateResultModeImages(root) {
    root.querySelectorAll(".result-mode-art img").forEach((image) => {
      const fallback = image.nextElementSibling;
      image.addEventListener("load", () => {
        image.classList.add("loaded");
        if (fallback) fallback.classList.add("hidden");
      });
      image.addEventListener("error", () => {
        image.classList.add("hidden");
        if (fallback) fallback.classList.remove("hidden");
      });
      if (image.complete && image.naturalWidth > 0) {
        image.classList.add("loaded");
        if (fallback) fallback.classList.add("hidden");
      }
    });
  }

  function bindResultRoleSwipe(root) {
    root.querySelectorAll(".result-mode-art[data-gallery='true']").forEach((art) => {
      art.addEventListener("pointerdown", (event) => {
        resultRoleSwipe = {
          target: art,
          x: event.clientX,
          y: event.clientY
        };
        if (art.setPointerCapture) art.setPointerCapture(event.pointerId);
      });
      art.addEventListener("pointerup", (event) => {
        if (!resultRoleSwipe || resultRoleSwipe.target !== art) return;
        const dx = event.clientX - resultRoleSwipe.x;
        const dy = event.clientY - resultRoleSwipe.y;
        resultRoleSwipe = null;
        if (Math.abs(dx) < 34 || Math.abs(dx) < Math.abs(dy)) return;
        switchResultRole(art.closest(".result-mode-card"), dx < 0 ? 1 : -1);
      });
      art.addEventListener("pointercancel", () => {
        resultRoleSwipe = null;
      });
    });
  }

  function switchResultRole(card, step) {
    if (!card) return;
    const code = card.dataset.code || "";
    const type = getType(code);
    const gallery = getRoleGallery(type, code);
    if (gallery.length <= 1) return;
    const currentIndex = Math.max(0, Number(card.dataset.roleIndex) || 0);
    const nextIndex = (currentIndex + step + gallery.length) % gallery.length;
    const item = gallery[nextIndex];
    card.dataset.roleIndex = String(nextIndex);
    state.selectedRoles[code] = item.role;
    saveState();
    updateResultModeCardRole(card, item, nextIndex, gallery.length);
    if (lastResultData && code === lastResultData.partnerCode) {
      syncPrimaryRoleArt(item);
    }
  }

  function updateResultModeCardRole(card, item, index, count) {
    const image = card.querySelector(".result-mode-art img");
    const fallback = card.querySelector(".result-mode-fallback");
    const hint = card.querySelector(".result-role-switch-hint");
    const roles = card.querySelector(".result-mode-roles");
    if (image) {
      image.classList.remove("loaded", "hidden");
      image.onload = () => {
        image.classList.add("loaded");
        if (fallback) fallback.classList.add("hidden");
      };
      image.onerror = () => {
        image.classList.add("hidden");
        if (fallback) fallback.classList.remove("hidden");
      };
      image.src = item.src;
    }
    if (hint) hint.textContent = roleSwitchHint(index, count);
    if (roles) roles.textContent = `角色参考：当前展示 ${item.role} · 双人物标签`;
  }

  function syncPrimaryRoleArt(item) {
    stopRoleArtCycle();
    const index = roleArtItems.findIndex((roleItem) => roleItem.role === item.role);
    if (index >= 0) roleArtIndex = index;
    renderRoleAffinity(item.role, roleAffinityLabel);
    setSoftRoleImage(els.sideArtImage, item.src, els.artPlaceholder);
    setImage(els.resultAvatarImage, item.src, els.resultAvatarFallback);
    if (els.roleArtName && roleArtItems.length > 1) {
      els.roleArtName.textContent = `立绘 ${roleArtIndex + 1}/${roleArtItems.length}`;
    }
  }

  function roleSwitchHint(index, count) {
    return `滑动切换 ${index + 1}/${count}`;
  }

  function resultModeRoleText(type, gallery, selectedRole) {
    if (gallery.length > 1 && selectedRole) return `当前展示 ${selectedRole.role} · 双人物标签`;
    return characterTextForType(type);
  }

  function renderTypeLayerCards(result) {
    const layers = [
      {
        label: "你希望伴侣的依恋模式",
        code: result.partnerCode,
        displayCode: result.partnerDisplayCode,
        type: getType(result.partnerCode),
        profile: getProfile(result.partnerCode),
        paragraph: getProfile(result.partnerCode).partner_expectation
      },
      {
        label: "你自己的依恋模式",
        code: result.selfCode,
        displayCode: result.selfDisplayCode,
        type: getType(result.selfCode),
        profile: getProfile(result.selfCode),
        paragraph: getProfile(result.selfCode).self_attachment
      }
    ];

    return layers.map((layer, index) => {
      const character = characterTextForType(layer.type);
      const image = getTypeIllustration(layer.type, layer.code);
      return [
        `<article class="type-card${index === 0 ? " priority" : ""}">`,
        '<div class="type-card-top">',
        '<div>',
        `<span class="type-label">${escapeHtml(layer.label)}</span>`,
        `<h3 class="type-title">${escapeHtml(layer.type.title)}</h3>`,
        '<div class="type-code-row">',
        `<strong class="type-code">${escapeHtml(layer.displayCode)}</strong>`,
        `<span class="legacy-code type-legacy-code">SALT：${escapeHtml(layer.code)}</span>`,
        "</div>",
        "</div>",
        renderTypeArt(image, layer.code),
        "</div>",
        character ? `<p class="type-character">角色参考：${escapeHtml(character)}</p>` : '<p class="type-character muted">角色参考：待补充</p>',
        `<p class="type-paragraph">${escapeHtml(layer.paragraph || "这部分文案可以在 data/result_profiles.json 中补充。")}</p>`,
        "</article>"
      ].join("");
    }).join("");
  }

  function renderTypeArt(image, fallback) {
    if (!image) {
      return `<div class="type-card-art placeholder"><span>${escapeHtml(fallback.slice(0, 2))}</span></div>`;
    }
    return [
      '<div class="type-card-art">',
      `<img src="${escapeAttribute(image)}" alt="">`,
      `<span class="type-art-fallback hidden">${escapeHtml(fallback.slice(0, 2))}</span>`,
      "</div>"
    ].join("");
  }

  function hydrateInlineImages(root) {
    root.querySelectorAll(".type-card-art img").forEach((image) => {
      const fallback = image.nextElementSibling;
      image.addEventListener("error", () => {
        image.classList.add("hidden");
        if (fallback) fallback.classList.remove("hidden");
      });
    });
  }

  function renderResultProfile(result) {
    const partnerProfile = getProfile(result.partnerCode);
    const selfProfile = getProfile(result.selfCode);
    const gapProfile = partnerProfile.relationship_gap ? partnerProfile : getProfile(result.code);
    const blocks = [
      profileBlock("你希望伴侣怎么依恋", partnerProfile.partner_expectation || partnerProfile.what_they_expect),
      profileBlock("你怎么依恋", selfProfile.self_attachment || selfProfile.how_they_love),
      profileBlock("关系差值", gapProfile.relationship_gap),
      profileBlock("支持偏好叠加", partnerProfile.support_overlay_hint || selfProfile.support_overlay_hint)
    ].filter(Boolean).join("");

    els.profileGrid.innerHTML = blocks;
    els.profileSection.classList.toggle("hidden", !blocks);
  }

  function profileBlock(title, text) {
    if (!text) return "";
    return [
      '<article class="profile-block">',
      `<h4>${escapeHtml(title)}</h4>`,
      `<p>${escapeHtml(text)}</p>`,
      "</article>"
    ].join("");
  }

  function renderAnswerCode(result) {
    els.answerCodeText.textContent = "生成中...";
    els.answerCodeText.classList.remove("hidden");
    els.toggleAnswerCodeButton.textContent = "隐藏";
    getVisibleAnswerCode(result).then((code) => {
      if (!lastResultData || lastResultData.answerSignature !== result.answerSignature) return;
      els.answerCodeText.textContent = code;
      els.answerCodeInput.value = code;
    }).catch(() => {
      els.answerCodeText.textContent = "答案码生成失败，请刷新后重试。";
    });
  }

  function toggleAnswerCode() {
    const hidden = els.answerCodeText.classList.toggle("hidden");
    els.toggleAnswerCodeButton.textContent = hidden ? "查看" : "隐藏";
  }

  function toggleDecoder() {
    els.decoderPanel.classList.toggle("hidden");
  }

  async function decodeAnswerCodeFromPanel() {
    const code = els.answerCodeInput.value.trim();
    if (!code) {
      showToast("先粘贴答案码。");
      return;
    }
    try {
      const payload = await decodeAnswerCode(code);
      els.decodeOutput.textContent = JSON.stringify(payload, null, 2);
      showToast("答案码已解析。");
    } catch (error) {
      els.decodeOutput.textContent = "";
      showToast("答案码解析失败。");
    }
  }

  function selectAnswer(value) {
    const question = currentQuestion();
    if (state.mode !== "quiz" || !question || !Number.isFinite(value)) return;
    state.answers[question.id] = value;
    state.answerCode = "";
    state.answerFingerprint = "";
    if (state.mode !== "result") state.completedAt = "";
    saveState();
    renderQuestion();
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = window.setTimeout(() => {
      autoAdvanceTimer = 0;
      goNext();
    }, 180);
  }

  function startQuiz() {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = 0;
    if (state.mode === "intro" && Object.keys(state.answers).length === 0) {
      state.questionOrder = shuffledQuestionIds();
      state.current = 0;
    }
    ensureQuestionOrder();
    state.mode = "quiz";
    state.current = Math.max(0, Math.min(displayQuestions().length - 1, Number(state.current) || 0));
    saveState();
    renderQuestion();
  }

  function goNext() {
    ensureQuestionOrder();
    const ordered = displayQuestions();
    const question = ordered[state.current];
    if (!question) return;
    if (!Object.prototype.hasOwnProperty.call(state.answers, question.id)) {
      showToast("先选择这一题的答案。");
      return;
    }
    if (state.current < ordered.length - 1) {
      state.current += 1;
      saveState();
      renderQuestion();
      return;
    }
    if (!isComplete()) {
      const firstMissing = ordered.findIndex((item) => !Object.prototype.hasOwnProperty.call(state.answers, item.id));
      state.current = Math.max(0, firstMissing);
      saveState();
      showToast("还有题目没有回答。");
      renderQuestion();
      return;
    }
    state.mode = "result";
    state.completedAt = state.completedAt || new Date().toISOString();
    saveState();
    renderResult();
  }

  function goBack() {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = 0;
    if (state.mode === "result") {
      state.mode = "quiz";
      ensureQuestionOrder();
      state.current = Math.max(0, displayQuestions().length - 1);
      saveState();
      renderQuestion();
      return;
    }
    if (state.mode === "intro") return;
    if (state.current > 0) {
      state.current -= 1;
      saveState();
      renderQuestion();
      return;
    }
    state.mode = "intro";
    saveState();
    renderIntro();
  }

  function restart() {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = 0;
    state = createInitialState();
    clearState();
    renderIntro();
  }

  function updateProgress(forceComplete, forcedAnswered) {
    const answered = Number.isFinite(forcedAnswered) ? forcedAnswered : (forceComplete ? allQuestions.length : countAnswered());
    const total = allQuestions.length || 1;
    els.questionCount.textContent = `${answered} / ${total}`;
    els.progressFill.style.width = `${clamp((answered / total) * 100, 0, 100)}%`;
  }

  function calculateResult() {
    const answers = state.answers;
    const axes = {};
    ["S", "A", "L"].forEach((axis) => {
      const selfSum = sumQuestions((q) => q.section === "main" && q.axis === axis && q.perspective === "self", answers, true);
      const otherSum = sumQuestions((q) => q.section === "main" && q.axis === axis && q.perspective === "other", answers, true);
      const self = clamp((selfSum / 12) * 100);
      const other = clamp((otherSum / 12) * 100);
      const score = clamp((self + other) / 2);
      axes[axis] = {
        self,
        other,
        score,
        sign: score >= 0 ? "+" : "-",
        selfSign: self >= 0 ? "+" : "-",
        otherSign: other >= 0 ? "+" : "-"
      };
    });

    const pairs = {};
    (questions.main || []).forEach((question) => {
      if (!pairs[question.pair]) pairs[question.pair] = {};
      pairs[question.pair][question.perspective] = scoredAnswer(question, answers);
    });

    let absGapTotal = 0;
    let gapTotal = 0;
    Object.keys(pairs).forEach((pairKey) => {
      const pair = pairs[pairKey];
      const gap = (Number(pair.other) || 0) - (Number(pair.self) || 0);
      absGapTotal += Math.abs(gap);
      gapTotal += gap;
    });

    const tScore = clamp(100 - 200 * (absGapTotal / 72));
    const tDirection = clamp((gapTotal / 72) * 100);
    const tSign = tScore >= 40 ? "+" : "-";
    const code = buildCode(axes.S.sign, axes.A.sign, axes.L.sign, tSign);
    const selfCode = buildCode(axes.S.selfSign, axes.A.selfSign, axes.L.selfSign, tSign);
    const partnerCode = buildCode(axes.S.otherSign, axes.A.otherSign, axes.L.otherSign, tSign);
    const displayCode = displayCodeForCode(code);
    const selfDisplayCode = displayCodeForCode(selfCode);
    const partnerDisplayCode = displayCodeForCode(partnerCode);
    const supportScores = calculateSupportScores(answers);
    const supportRanking = Object.keys(supportScores)
      .map((key) => ({ key, score: supportScores[key], profile: supportProfiles[key] || {} }))
      .sort((a, b) => b.score - a.score);

    return {
      code,
      selfCode,
      partnerCode,
      displayCode,
      selfDisplayCode,
      partnerDisplayCode,
      S: axes.S,
      A: axes.A,
      L: axes.L,
      tScore,
      tDirection,
      tSign,
      supportScores,
      supportRanking,
      completedAt: state.completedAt || new Date().toISOString(),
      answerSignature: buildAnswerSignature(answers)
    };
  }

  function buildCode(sSign, aSign, lSign, tSign) {
    return `S${sSign}A${aSign}L${lSign}T${tSign}`;
  }

  function displayCodeForCode(code) {
    const match = /^S([+-])A([+-])L([+-])T([+-])$/.exec(String(code || ""));
    if (!match) return String(code || "");
    return [
      DISPLAY_LETTERS.S[match[1]],
      DISPLAY_LETTERS.A[match[2]],
      DISPLAY_LETTERS.L[match[3]],
      DISPLAY_LETTERS.T[match[4]]
    ].join("");
  }

  function formatCodePair(displayCode, saltCode) {
    return `${displayCode}（SALT：${saltCode}）`;
  }

  function calculateSupportScores(answers) {
    const scores = {};
    Object.keys(supportProfiles).forEach((key) => {
      const sum = sumQuestions((q) => q.section === "support" && q.support === key, answers, false);
      scores[key] = clamp((sum / 4) * 100);
    });
    return scores;
  }

  function sumQuestions(predicate, answers, useDirection) {
    return allQuestions.reduce((total, question) => {
      if (!predicate(question)) return total;
      return total + (useDirection ? scoredAnswer(question, answers) : rawAnswer(question, answers));
    }, 0);
  }

  function rawAnswer(question, answers) {
    return Number(answers[question.id]) || 0;
  }

  function scoredAnswer(question, answers) {
    const direction = Number(question.direction) === -1 ? -1 : 1;
    return rawAnswer(question, answers) * direction;
  }

  function renderScoreRows(result, mode) {
    return getDimensionRows(result, mode).map((row) => renderMeterRow(row)).join("");
  }

  function getDimensionRows(result, mode) {
    const source = mode === "self" ? "self" : "other";
    return [
      { title: "特殊性", value: result.S[source], left: "U", right: "O", leftText: "专属", rightText: "开放", positiveLabel: "强专属", negativeLabel: "弱专属" },
      { title: "兑现力", value: result.A[source], left: "D", right: "I", leftText: "兑现", rightText: "内隐", positiveLabel: "强兑现", negativeLabel: "弱兑现" },
      { title: "长程性", value: result.L[source], left: "R", right: "N", leftText: "长程", rightText: "当下", positiveLabel: "强长程", negativeLabel: "弱长程" },
      { title: "双向性", value: result.tScore, left: "M", right: "X", leftText: "双向", rightText: "错位", positiveLabel: "强双向", negativeLabel: "强错位" }
    ];
  }

  function renderComparisonRows(result) {
    return getComparisonRows(result).map((row) => [
      '<div class="comparison-row">',
      '<div class="comparison-label">',
      `<strong>${escapeHtml(row.title)}</strong>`,
      `<span>${escapeHtml(row.axisText)}</span>`,
      "</div>",
      '<div class="comparison-values">',
      comparisonMode("我会给出", row.selfText, "self"),
      comparisonMode("我期待对方", row.otherText, "other"),
      "</div>",
      `<div class="comparison-summary ${escapeAttribute(row.tone)}">${escapeHtml(row.summary)}</div>`,
      "</div>"
    ].join("")).join("");
  }

  function getComparisonRows(result) {
    return [
      { axis: "S", title: "特殊性", axisText: "专属 / 开放", self: result.S.self, other: result.S.other },
      { axis: "A", title: "兑现力", axisText: "兑现 / 内隐", self: result.A.self, other: result.A.other },
      { axis: "L", title: "长程性", axisText: "长程 / 当下", self: result.L.self, other: result.L.other }
    ].map((row) => {
      const gap = row.other - row.self;
      return {
        ...row,
        selfText: describeAxisValue(row.axis, "self", row.self),
        otherText: describeAxisValue(row.axis, "other", row.other),
        summary: describeAxisGap(row.axis, gap),
        tone: gap > 8 ? "expect" : gap < -8 ? "give" : "balanced"
      };
    });
  }

  function describeAxisValue(axis, side, value) {
    const level = value >= 30 ? "high" : value <= -30 ? "low" : "mid";
    const copy = {
      S: {
        self: {
          high: "我会主动把伴侣放在特别位置",
          mid: "我会按关系状态给出适度专属感",
          low: "我对伴侣不太习惯特殊对待"
        },
        other: {
          high: "期待对方对自己更特殊",
          mid: "希望对方给我适度的特殊确认",
          low: "不太要求对方把我特殊对待"
        }
      },
      A: {
        self: {
          high: "我会把在意落实成行动",
          mid: "我会在关键处给出可见回应",
          low: "我表达在意更容易停在心里"
        },
        other: {
          high: "期待对方用行动证明在意",
          mid: "希望对方在关键处有回应",
          low: "能接受对方行动少一点"
        }
      },
      L: {
        self: {
          high: "我会把伴侣放进长期安排",
          mid: "我会视关系稳定度逐步规划",
          low: "我更习惯按当下状态相处"
        },
        other: {
          high: "期待对方把我纳入长期计划",
          mid: "希望关系自然进入对方生活",
          low: "不太要求对方立刻规划未来"
        }
      }
    };
    return copy[axis][side][level];
  }

  function describeAxisGap(axis, gap) {
    const copy = {
      S: {
        expect: "期待对方对自己更特殊",
        slightExpect: "略期待对方给更多特殊确认",
        give: "自己更容易主动给专属感",
        slightGive: "自己会多给一点特殊位置",
        balanced: "专属感给出和期待接近"
      },
      A: {
        expect: "期待对方更主动兑现",
        slightExpect: "略期待对方行动更明确",
        give: "自己更容易主动兑现",
        slightGive: "自己会多承担一点行动回应",
        balanced: "行动给出和期待接近"
      },
      L: {
        expect: "期待对方更多纳入未来",
        slightExpect: "略期待对方给长期信号",
        give: "自己更容易规划长期",
        slightGive: "自己会多考虑长期安排",
        balanced: "长期感给出和期待接近"
      }
    };
    if (gap > 30) return copy[axis].expect;
    if (gap > 8) return copy[axis].slightExpect;
    if (gap < -30) return copy[axis].give;
    if (gap < -8) return copy[axis].slightGive;
    return copy[axis].balanced;
  }

  function renderSupportRanking(ranking) {
    return ranking.map((item, index) => {
      const profile = item.profile || {};
      const label = profile.label || item.key;
      return [
        '<div class="support-row">',
        `<div class="support-label"><span class="support-rank">${index + 1}</span>${artBadge(profile.badge || item.key, label.slice(0, 1))}<span>${escapeHtml(label)}</span></div>`,
        `<div class="meter"><span class="meter-marker" style="left: ${scoreToPercent(item.score)}"></span></div>`,
        `<div class="support-value">${escapeHtml(getBandLabel(item.score))}</div>`,
        "</div>"
      ].join("");
    }).join("");
  }

  function renderGapCard(result) {
    const vector = getGapVector(result);
    return [
      `<article class="gap-panel gap-${escapeAttribute(vector.direction)}">`,
      '<div class="gap-vector-head">',
      '<span>我会给出</span>',
      `<strong>${escapeHtml(vector.title)}</strong>`,
      '<span>我期待对方</span>',
      "</div>",
      '<div class="gap-vector-track">',
      '<i></i>',
      `<b style="--gap-width: ${escapeAttribute(vector.width)}"></b>`,
      "</div>",
      '<div class="gap-vector-summary">',
      `<span>${escapeHtml(vector.directionLabel)}</span>`,
      `<span>${escapeHtml(vector.intensityLabel)}</span>`,
      "</div>",
      `<p>${escapeHtml(vector.copy)}</p>`,
      "</article>"
    ].join("");
  }

  function getGapVector(result) {
    const direction = result.tDirection > 8 ? "expect" : result.tDirection < -8 ? "give" : "balanced";
    const width = `${Math.min(46, Math.max(direction === "balanced" ? 8 : 12, Math.abs(result.tDirection) * 0.72)).toFixed(1)}%`;
    const intensityLabel = result.tScore >= 70 ? "偏差很轻" : result.tScore >= 40 ? "可见偏差" : result.tScore >= 0 ? "明显偏差" : "强烈错位";
    const title = direction === "expect" ? "期待端更重" : direction === "give" ? "给出端更重" : "双向较平衡";
    const directionLabel = direction === "expect" ? "矢量指向：我期待对方" : direction === "give" ? "矢量指向：我会给出" : "矢量接近中心";
    const copy = direction === "expect"
      ? "你的期待端更重，容易希望对方先给出确认、行动或长期信号。箭头越往右，越说明你需要把期待说得更具体。"
      : direction === "give"
        ? "你的给出端更重，容易先承担、先解释、先把关系接住。箭头越往左，越需要留意自己有没有把需求压低。"
        : "你的给出和期待大致同频，真正需要看的不是谁更多，而是哪一个维度最容易让你不安。";
    return { direction, width, intensityLabel, title, directionLabel, copy };
  }

  function renderMeterRow(row) {
    const state = getDimensionState(row);
    return [
      '<div class="score-row">',
      '<div class="score-label">',
      `<strong>${escapeHtml(row.title)}</strong>`,
      `<span>${escapeHtml(row.leftText)} / ${escapeHtml(row.rightText)}</span>`,
      "</div>",
      '<div class="dimension-meter">',
      `<span class="axis-code-chip positive">${escapeHtml(row.left)}</span>`,
      `<div class="meter"><span class="meter-marker" style="left: ${axisScoreToPercent(row.value)}"></span></div>`,
      `<span class="axis-code-chip negative">${escapeHtml(row.right)}</span>`,
      "</div>",
      `<div class="score-state ${escapeAttribute(state.tone)}">${escapeHtml(state.label)}</div>`,
      "</div>"
    ].join("");
  }

  function getDimensionState(row) {
    const score = clamp(row.value);
    if (score >= 30) return { label: row.positiveLabel, tone: "positive" };
    if (score <= -30) return { label: row.negativeLabel, tone: "negative" };
    return { label: "中立", tone: "neutral" };
  }

  function miniMeter(label, value) {
    return [
      '<div class="mini-meter">',
      `<span>${escapeHtml(label)} · ${escapeHtml(getBandLabel(value))}</span>`,
      `<div class="mini-track"><span class="mini-fill" style="width: ${scoreToPercent(value)}"></span></div>`,
      "</div>"
    ].join("");
  }

  function comparisonMode(label, text, kind) {
    return [
      `<div class="comparison-mode ${escapeAttribute(kind)}">`,
      `<span>${escapeHtml(label)}</span>`,
      `<strong>${escapeHtml(text)}</strong>`,
      "</div>"
    ].join("");
  }

  function artBadge(key, fallback) {
    const asset = getArtAsset("badges", key, "");
    if (asset) {
      return `<span class="art-badge" style="background-image: ${cssUrl(asset)}"></span>`;
    }
    return `<span class="art-badge">${escapeHtml(fallback)}</span>`;
  }

  function getTDirectionText(tScore, tDirection) {
    let symmetry = "你的给出和期待整体比较对称，自己要的东西也比较愿意给出去，关系里不太容易只剩一边用力。";
    if (tScore < 0) {
      symmetry = "你的给出和期待之间有强烈错位，某些维度里你想收到的东西，和你实际给出的方式并不在同一个节奏上。";
    } else if (tScore < 40) {
      symmetry = "你的给出和期待之间有可见差值，这段关系还有沟通空间，重点是把具体需求说得更清楚。";
    }

    if (tDirection > 8) {
      return `${symmetry}方向上更偏“期待对方更多”：你可能更需要对方给出确认、行动或长期安排，否则会开始靠猜来维持安全感。`;
    }
    if (tDirection < -8) {
      return `${symmetry}方向上更偏“自我消音 / 给得更多”：你可能先承担、先解释、先压低自己的需要，久了容易觉得委屈却说不出口。`;
    }
    return `${symmetry}方向上接近相对平衡，或者不同维度的差值彼此抵消；真正值得看的是哪一项让你最容易不安。`;
  }

  function getSupportAnalysis(ranking) {
    if (!ranking.length) return "支持偏好数据不足。";
    const first = ranking[0];
    const second = ranking[1] || ranking[0];
    const firstLabel = first.profile.label || first.key;
    const secondLabel = second.profile.label || second.key;
    if (first.score < 0) {
      return "你的支持偏好整体比较克制，说明你不一定会轻易把安全感交给外部支持，更可能先靠自己消化或观察关系是否稳定。";
    }
    const firstChannel = first.profile.channel || "被对方认真回应";
    const secondChannel = second.profile.channel || "关系保持稳定";
    return `你的支持偏好更偏${firstLabel}与${secondLabel}，说明你不一定只需要被劝或被解决，更容易通过${firstChannel}、${secondChannel}来感到被理解。`;
  }

  function setupRoleArt(roles, result, roleLabel) {
    const items = getRoleArtItems(roles);
    roleArtItems = items;
    roleArtIndex = 0;
    roleAffinityLabel = roleLabel || DEFAULT_ROLE_AFFINITY_LABEL;
    stopRoleArtCycle();

    if (!items.length) {
      applySideArt("result");
      setAxisAvatar(result);
      return;
    }

    els.artWindow.classList.add("role-art-mode");
    els.roleArtMeta.classList.remove("hidden");
    els.roleArtSwitch.classList.toggle("hidden", items.length <= 1);
    renderRoleArtItem(0);

    if (items.length > 1) {
      roleArtTimer = window.setInterval(() => showNextRoleArt(false), 3600);
    }
  }

  function getRoleArtItems(roles) {
    return roles
      .map((role) => {
        const src = getRoleImage(role);
        return src ? { role, src } : null;
      })
      .filter(Boolean);
  }

  function getRoleGallery(type, code) {
    const roles = rolesForType(type);
    if (roles.length < 2) return [];
    const seen = new Set();
    return roles.map((role) => {
      const key = normalizeRoleName(role);
      if (!key || seen.has(key)) return null;
      seen.add(key);
      const src = getRoleImage(role);
      return src ? { role, src, code } : null;
    }).filter(Boolean);
  }

  function getSelectedRoleItem(code, gallery) {
    if (!gallery.length) return null;
    const selected = state.selectedRoles && state.selectedRoles[code];
    return gallery.find((item) => item.role === selected) || gallery[0];
  }

  function getSelectedTypeImage(type, code) {
    const gallery = getRoleGallery(type, code);
    const selected = getSelectedRoleItem(code, gallery);
    return selected ? selected.src : getTypeIllustration(type, code);
  }

  function renderRoleArtItem(index) {
    if (!roleArtItems.length) return;
    const item = roleArtItems[index % roleArtItems.length];
    roleArtIndex = index % roleArtItems.length;
    const countText = roleArtItems.length > 1 ? `${roleArtIndex + 1}/${roleArtItems.length}` : "";
    els.roleArtName.textContent = countText ? `立绘 ${countText}` : "立绘";
    renderRoleAffinity(item.role, roleAffinityLabel);
    setSoftRoleImage(els.sideArtImage, item.src, els.artPlaceholder);
    setImage(els.resultAvatarImage, item.src, els.resultAvatarFallback);
  }

  function renderRoleAffinity(roleText, labelText) {
    if (!roleText) {
      els.resultRoles.innerHTML = "";
      els.resultRoles.classList.add("hidden");
      return;
    }
    els.resultRoles.innerHTML = [
      `<span class="role-affinity-label">${escapeHtml(labelText || DEFAULT_ROLE_AFFINITY_LABEL)}</span>`,
      `<strong>${escapeHtml(roleText)}</strong>`
    ].join("");
    els.resultRoles.classList.remove("hidden");
  }

  function setSoftRoleImage(image, src, fallbackElement) {
    if (!image) return;
    window.clearTimeout(roleArtFadeTimer);
    if (!src) {
      image.classList.remove("soft-visible");
      setImage(image, src, fallbackElement);
      return;
    }
    if (image.getAttribute("src") === src && !image.classList.contains("hidden")) {
      image.classList.add("soft-visible");
      if (fallbackElement) fallbackElement.classList.add("hidden");
      return;
    }
    image.classList.remove("soft-visible");
    roleArtFadeTimer = window.setTimeout(() => {
      image.onload = () => {
        image.classList.remove("hidden");
        if (fallbackElement) fallbackElement.classList.add("hidden");
        window.requestAnimationFrame(() => image.classList.add("soft-visible"));
      };
      image.onerror = () => {
        image.classList.add("hidden");
        image.classList.remove("soft-visible");
        image.removeAttribute("src");
        if (fallbackElement) fallbackElement.classList.remove("hidden");
      };
      image.src = src;
      if (image.complete && image.naturalWidth > 0) image.onload();
    }, 170);
  }

  function showNextRoleArt(resetTimer) {
    if (roleArtItems.length <= 1) return;
    if (resetTimer) {
      stopRoleArtCycle();
      renderRoleArtItem(roleArtIndex + 1);
      roleArtTimer = window.setInterval(() => showNextRoleArt(false), 3600);
      return;
    }
    renderRoleArtItem(roleArtIndex + 1);
  }

  function stopRoleArtCycle() {
    window.clearTimeout(roleArtFadeTimer);
    roleArtFadeTimer = 0;
    if (roleArtTimer) {
      window.clearInterval(roleArtTimer);
      roleArtTimer = 0;
    }
  }

  function clearRoleArt() {
    stopRoleArtCycle();
    roleArtItems = [];
    roleArtIndex = 0;
    els.artWindow.classList.remove("role-art-mode");
    els.sideArtImage.classList.remove("soft-visible");
    els.roleArtMeta.classList.add("hidden");
    els.roleArtName.textContent = "";
  }

  function setMainAvatar(type, code, result) {
    const image = getTypeIllustration(type, code);
    if (image) {
      setImage(els.resultAvatarImage, image, els.resultAvatarFallback);
      return;
    }
    setAxisAvatar(result);
  }

  function setAxisAvatar(result) {
    const avatarKey = pickAvatarKey(result);
    const asset = getArtAsset("avatars", avatarKey, getArtAsset("avatars", "default", ""));
    setImage(els.resultAvatarImage, asset, els.resultAvatarFallback);
  }

  function pickAvatarKey(result) {
    const candidates = [
      { key: "S_plus", value: result.S.score },
      { key: "A_plus", value: result.A.score },
      { key: "L_plus", value: result.L.score },
      { key: "T_plus", value: result.tScore }
    ].sort((a, b) => b.value - a.value);
    return candidates[0] && candidates[0].value >= 40 ? candidates[0].key : "default";
  }

  function applySideArt(mode) {
    clearRoleArt();
    const resultAsset = getArtAsset("result_cards", "default", "");
    const backgroundAsset = getArtAsset("backgrounds", mode, getArtAsset("backgrounds", "default", ""));
    setImage(els.sideArtImage, resultAsset || backgroundAsset, els.artPlaceholder);
  }

  function applyBackground(mode) {
    const asset = getArtAsset("backgrounds", mode, getArtAsset("backgrounds", "default", ""));
    els.backgroundArt.style.backgroundImage = asset ? cssUrl(asset) : "";
  }

  function setImage(image, src, fallbackElement) {
    if (!image) return;
    if (!src) {
      image.classList.add("hidden");
      image.removeAttribute("src");
      if (fallbackElement) fallbackElement.classList.remove("hidden");
      return;
    }
    image.onerror = () => {
      image.classList.add("hidden");
      image.removeAttribute("src");
      if (fallbackElement) fallbackElement.classList.remove("hidden");
    };
    image.onload = () => {
      image.classList.remove("hidden");
      if (fallbackElement) fallbackElement.classList.add("hidden");
    };
    image.src = src;
  }

  async function copyResult() {
    const result = calculateResult();
    const code = await getVisibleAnswerCode(result);
    const text = buildShareText(result, code);
    writeClipboard(text).then(() => {
      showToast("结果文案已复制。");
    }).catch(() => {
      showToast("复制失败，可以手动选择结果文字。");
    });
  }

  async function shareResult() {
    const result = calculateResult();
    const code = await getVisibleAnswerCode(result);
    const text = buildShareText(result, code);
    if (navigator.share) {
      try {
        await navigator.share({ title: "SALT 关系倾向测试", text });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    await writeClipboard(text);
    showToast("当前环境不能直接分享，已复制结果文案。");
  }

  async function saveResultImage() {
    try {
      const result = calculateResult();
      const code = await getVisibleAnswerCode(result);
      const canvas = await buildShareCanvas(result, code);
      await downloadCanvas(canvas, `SALT-${result.partnerDisplayCode}-${Date.now()}.png`);
      showToast("结果图已保存。");
    } catch (error) {
      showToast("保存结果图失败。");
    }
  }

  function buildShareText(result, answerCode) {
    const selfType = getType(result.selfCode);
    const partnerType = getType(result.partnerCode);
    const topSupport = result.supportRanking[0];
    const supportLabel = topSupport && topSupport.profile ? topSupport.profile.label : "";
    return [
      "SALT 关系倾向测试",
      `你希望伴侣的依恋模式：${formatCodePair(result.partnerDisplayCode, result.partnerCode)} ${partnerType.title}`,
      partnerType.description ? `伴侣期待：${partnerType.description}` : "",
      `你自己的依恋模式：${formatCodePair(result.selfDisplayCode, result.selfCode)} ${selfType.title}`,
      selfType.description ? `自我依恋：${selfType.description}` : "",
      supportLabel ? `支持偏好：${supportLabel}` : "",
      `答案码：${answerCode}`
    ].filter(Boolean).join("\n");
  }

  async function buildShareCanvas(result, answerCode) {
    const width = 1200;
    const height = 1980;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const selfType = getType(result.selfCode);
    const partnerType = getType(result.partnerCode);
    const [partnerImage, selfImage] = await Promise.all([
      loadCanvasImage(getSelectedTypeImage(partnerType, result.partnerCode)),
      loadCanvasImage(getSelectedTypeImage(selfType, result.selfCode))
    ]);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#08111f");
    gradient.addColorStop(0.48, "#261638");
    gradient.addColorStop(1, "#0e3b36");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundedRect(ctx, 64, 64, width - 128, height - 128, 28);
    ctx.fill();

    ctx.fillStyle = "#8ef3c5";
    ctx.font = "700 34px Microsoft YaHei, sans-serif";
    ctx.fillText("SALT 关系倾向测试", 104, 126);

    drawShareModeCard(ctx, 104, 166, 990, 230, {
      label: "你希望伴侣的模式",
      displayCode: result.partnerDisplayCode,
      saltCode: result.partnerCode,
      title: partnerType.title,
      subtitle: partnerType.description || "",
      image: partnerImage
    });
    drawShareModeCard(ctx, 104, 426, 990, 230, {
      label: "你自己的模式",
      displayCode: result.selfDisplayCode,
      saltCode: result.selfCode,
      title: selfType.title,
      subtitle: selfType.description || "",
      image: selfImage
    });

    drawCanvasDimensionCard(ctx, 104, 710, 480, 360, "伴侣期待维度概览", getDimensionRows(result, "partner"));
    drawCanvasDimensionCard(ctx, 614, 710, 480, 360, "自我依恋模式概览", getDimensionRows(result, "self"));
    drawCanvasComparison(ctx, 104, 1118, 990, 318, getComparisonRows(result));
    drawCanvasGapVector(ctx, 104, 1484, 990, 194, getGapVector(result));
    drawCanvasAnswerCode(ctx, 104, 1724, 990, 172, answerCode);

    return canvas;
  }

  function drawShareModeCard(ctx, x, y, width, height, item) {
    ctx.fillStyle = "rgba(10,18,33,0.42)";
    roundedRect(ctx, x, y, width, height, 22);
    ctx.fill();
    ctx.fillStyle = "#8ef3c5";
    ctx.font = "800 27px Microsoft YaHei, sans-serif";
    ctx.fillText(item.label, x + 30, y + 48);
    ctx.fillStyle = "#f7fbff";
    ctx.font = "900 58px Microsoft YaHei, sans-serif";
    ctx.fillText(item.title, x + 30, y + 112);
    ctx.fillStyle = "#8ef3c5";
    ctx.font = "900 34px Microsoft YaHei, sans-serif";
    ctx.fillText(item.displayCode, x + 30, y + 162);
    ctx.fillStyle = "rgba(231,238,247,0.62)";
    ctx.font = "700 22px Microsoft YaHei, sans-serif";
    ctx.fillText(`SALT：${item.saltCode}`, x + 172, y + 160);
    ctx.fillStyle = "rgba(231,238,247,0.82)";
    ctx.font = "700 25px Microsoft YaHei, sans-serif";
    drawWrappedCanvasText(ctx, item.subtitle, x + 30, y + 202, width - 286, 32, 2);

    if (item.image) {
      drawContainedImage(ctx, item.image, x + width - 214, y + 18, 168, height - 36);
    } else {
      drawImagePlaceholder(ctx, x + width - 214, y + 18, 168, height - 36, "SALT");
    }
  }

  function drawCanvasDimensionCard(ctx, x, y, width, height, title, rows) {
    ctx.fillStyle = "rgba(10,18,33,0.42)";
    roundedRect(ctx, x, y, width, height, 20);
    ctx.fill();
    ctx.fillStyle = "#f7fbff";
    ctx.font = "800 29px Microsoft YaHei, sans-serif";
    ctx.fillText(title, x + 24, y + 48);
    rows.forEach((row, index) => {
      const rowY = y + 88 + index * 62;
      const state = getDimensionState(row);
      drawCanvasDimensionRow(ctx, x + 24, rowY, width - 48, row, state);
    });
  }

  function drawCanvasDimensionRow(ctx, x, y, width, row, state) {
    ctx.fillStyle = "rgba(8,17,31,0.35)";
    roundedRect(ctx, x, y, width, 46, 12);
    ctx.fill();
    ctx.fillStyle = "#f7fbff";
    ctx.font = "800 22px Microsoft YaHei, sans-serif";
    ctx.fillText(row.title, x + 14, y + 29);
    drawCanvasCodeChip(ctx, x + 120, y + 8, row.left, "#7dd3fc", "#8ef3c5", "#06111d");
    drawCanvasCodeChip(ctx, x + width - 48, y + 8, row.right, "#f8c96a", "#fb7185", "#261407");
    drawCanvasAxisBar(ctx, x + 168, y + 20, width - 232, row.value);
    ctx.fillStyle = state.tone === "negative" ? "#f8c96a" : state.tone === "positive" ? "#8ef3c5" : "rgba(231,238,247,0.78)";
    ctx.font = "800 20px Microsoft YaHei, sans-serif";
    ctx.fillText(state.label, x + width - 132, y + 29);
  }

  function drawCanvasComparison(ctx, x, y, width, height, rows) {
    ctx.fillStyle = "rgba(10,18,33,0.42)";
    roundedRect(ctx, x, y, width, height, 20);
    ctx.fill();
    ctx.fillStyle = "#f7fbff";
    ctx.font = "800 30px Microsoft YaHei, sans-serif";
    ctx.fillText("我会给出 / 我期待对方", x + 24, y + 48);
    rows.forEach((row, index) => {
      const rowY = y + 78 + index * 76;
      ctx.fillStyle = "rgba(8,17,31,0.35)";
      roundedRect(ctx, x + 24, rowY, width - 48, 58, 12);
      ctx.fill();
      ctx.fillStyle = "#f7fbff";
      ctx.font = "800 22px Microsoft YaHei, sans-serif";
      ctx.fillText(row.title, x + 42, rowY + 36);
      ctx.fillStyle = "rgba(231,238,247,0.78)";
      ctx.font = "700 19px Microsoft YaHei, sans-serif";
      ctx.fillText(row.selfText, x + 150, rowY + 24);
      ctx.fillText(row.otherText, x + 150, rowY + 48);
      ctx.fillStyle = row.tone === "expect" ? "#f8c96a" : row.tone === "give" ? "#8ef3c5" : "rgba(231,238,247,0.78)";
      ctx.font = "800 20px Microsoft YaHei, sans-serif";
      drawWrappedCanvasText(ctx, row.summary, x + width - 276, rowY + 34, 230, 24, 2);
    });
  }

  function drawCanvasGapVector(ctx, x, y, width, height, vector) {
    ctx.fillStyle = "rgba(10,18,33,0.42)";
    roundedRect(ctx, x, y, width, height, 20);
    ctx.fill();
    ctx.fillStyle = "#f7fbff";
    ctx.font = "800 30px Microsoft YaHei, sans-serif";
    ctx.fillText("关系差值", x + 24, y + 48);
    ctx.fillStyle = "#8ef3c5";
    ctx.font = "900 28px Microsoft YaHei, sans-serif";
    ctx.fillText(vector.title, x + width - 238, y + 48);
    const trackX = x + 120;
    const trackY = y + 94;
    const trackW = width - 240;
    drawCanvasGapTrack(ctx, trackX, trackY, trackW, vector);
    ctx.fillStyle = "rgba(231,238,247,0.78)";
    ctx.font = "800 22px Microsoft YaHei, sans-serif";
    ctx.fillText("我会给出", x + 24, trackY + 8);
    ctx.fillText("我期待对方", x + width - 154, trackY + 8);
    ctx.fillStyle = "rgba(231,238,247,0.72)";
    ctx.font = "700 22px Microsoft YaHei, sans-serif";
    ctx.fillText(`${vector.directionLabel} · ${vector.intensityLabel}`, x + 24, y + 160);
  }

  function drawCanvasAnswerCode(ctx, x, y, width, height, answerCode) {
    ctx.fillStyle = "rgba(10,18,33,0.54)";
    roundedRect(ctx, x, y, width, height, 18);
    ctx.fill();
    ctx.fillStyle = "#8ef3c5";
    ctx.font = "800 24px Microsoft YaHei, sans-serif";
    ctx.fillText("答案码", x + 24, y + 38);
    ctx.fillStyle = "#f7fbff";
    ctx.font = "21px Consolas, monospace";
    drawWrappedCanvasText(ctx, answerCode, x + 24, y + 72, width - 48, 26, 4);
  }

  function drawCanvasCodeChip(ctx, x, y, text, colorA, colorB, textColor) {
    const gradient = ctx.createLinearGradient(x, y, x + 32, y + 32);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);
    ctx.fillStyle = gradient;
    roundedRect(ctx, x, y, 34, 34, 8);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.font = "900 20px Microsoft YaHei, sans-serif";
    ctx.fillText(text, x + 10, y + 24);
  }

  function drawCanvasAxisBar(ctx, x, y, width, value) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, "rgba(125,211,252,0.9)");
    gradient.addColorStop(0.5, "rgba(56,75,104,0.68)");
    gradient.addColorStop(1, "rgba(248,201,106,0.92)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    const markerX = x + width * ((100 - clamp(value)) / 200);
    ctx.fillStyle = "#8ef3c5";
    ctx.beginPath();
    ctx.arc(markerX, y, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCanvasGapTrack(ctx, x, y, width, vector) {
    ctx.strokeStyle = "rgba(231,238,247,0.18)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    const center = x + width / 2;
    ctx.strokeStyle = "rgba(247,251,255,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(center, y - 22);
    ctx.lineTo(center, y + 22);
    ctx.stroke();
    const vectorWidth = Math.max(26, width * (parseFloat(vector.width) / 100));
    const start = vector.direction === "give" ? center - vectorWidth : vector.direction === "balanced" ? center - vectorWidth / 2 : center;
    const end = vector.direction === "give" ? center : vector.direction === "balanced" ? center + vectorWidth / 2 : center + vectorWidth;
    ctx.strokeStyle = vector.direction === "give" ? "#7dd3fc" : vector.direction === "expect" ? "#f8c96a" : "#8ef3c5";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(start, y);
    ctx.lineTo(end, y);
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    if (vector.direction === "give") {
      ctx.moveTo(start - 12, y);
      ctx.lineTo(start + 6, y - 11);
      ctx.lineTo(start + 6, y + 11);
    } else if (vector.direction === "expect") {
      ctx.moveTo(end + 12, y);
      ctx.lineTo(end - 6, y - 11);
      ctx.lineTo(end - 6, y + 11);
    } else {
      ctx.arc(center, y, 12, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function drawWrappedCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = String(text).split("");
    let line = "";
    let lines = 0;
    chars.forEach((char) => {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        if (lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
        lines += 1;
        line = char;
      } else {
        line = test;
      }
    });
    if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
  }

  function drawContainedImage(ctx, image, x, y, width, height) {
    const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * ratio;
    const drawHeight = image.naturalHeight * ratio;
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function drawImagePlaceholder(ctx, x, y, width, height, text) {
    ctx.fillStyle = "rgba(125,211,252,0.12)";
    roundedRect(ctx, x, y, width, height, 18);
    ctx.fill();
    ctx.fillStyle = "rgba(247,251,255,0.72)";
    ctx.font = "900 54px Microsoft YaHei, sans-serif";
    ctx.fillText(text, x + 70, y + height / 2 + 18);
  }

  function loadCanvasImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function downloadCanvas(canvas, filename) {
    return new Promise((resolve, reject) => {
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas export failed"));
            return;
          }
          const url = URL.createObjectURL(blob);
          triggerDownload(url, filename);
          window.setTimeout(() => URL.revokeObjectURL(url), 500);
          resolve();
        }, "image/png");
        return;
      }
      try {
        triggerDownload(canvas.toDataURL("image/png"), filename);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  function triggerDownload(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function getVisibleAnswerCode(resultData) {
    const fingerprint = resultData.answerSignature;
    if (state.answerCode && state.answerFingerprint === fingerprint) {
      return state.answerCode;
    }
    const payload = buildAnswerPayload(resultData);
    const code = await encodeAnswerCode(payload);
    state.answerCode = code;
    state.answerFingerprint = fingerprint;
    state.completedAt = payload.completedAt;
    saveState();
    return code;
  }

  function buildAnswerPayload(resultData) {
    const answers = {};
    allQuestions.forEach((question) => {
      answers[question.id] = Number(state.answers[question.id]);
    });
    return {
      v: "salt-v4",
      answers,
      completedAt: state.completedAt || resultData.completedAt || new Date().toISOString(),
      scores: {
        S: roundScore(resultData.S.score),
        A: roundScore(resultData.A.score),
        L: roundScore(resultData.L.score),
        T_score: roundScore(resultData.tScore),
        T_direction: roundScore(resultData.tDirection),
        SelfS: roundScore(resultData.S.self),
        OtherS: roundScore(resultData.S.other),
        SelfA: roundScore(resultData.A.self),
        OtherA: roundScore(resultData.A.other),
        SelfL: roundScore(resultData.L.self),
        OtherL: roundScore(resultData.L.other)
      },
      code: resultData.code,
      selfCode: resultData.selfCode,
      partnerCode: resultData.partnerCode,
      displayCode: resultData.displayCode,
      selfDisplayCode: resultData.selfDisplayCode,
      partnerDisplayCode: resultData.partnerDisplayCode
    };
  }

  async function encodeAnswerCode(payload) {
    const compact = JSON.stringify(packAnswerPayload(payload));
    if (canUseAes()) {
      const encrypted = await encryptText(compact);
      return ANSWER_CODE_PREFIX_AES + bytesToBase64url(encrypted);
    }
    return ANSWER_CODE_PREFIX_XOR + bytesToBase64url(xorEncode(compact));
  }

  async function decodeAnswerCode(code) {
    const trimmed = String(code || "").trim();
    let compactJson = "";
    if (trimmed.startsWith(ANSWER_CODE_PREFIX_AES)) {
      const bytes = base64urlToBytes(trimmed.slice(ANSWER_CODE_PREFIX_AES.length));
      compactJson = await decryptText(bytes);
    } else if (trimmed.startsWith(ANSWER_CODE_PREFIX_XOR)) {
      const bytes = base64urlToBytes(trimmed.slice(ANSWER_CODE_PREFIX_XOR.length));
      compactJson = xorDecode(bytes);
    } else {
      throw new Error("Unknown answer code prefix");
    }
    return unpackAnswerPayload(JSON.parse(compactJson));
  }

  function packAnswerPayload(payload) {
    const order = allQuestions.map((question) => question.id);
    const answers = order.map((id) => String((Number(payload.answers[id]) || 0) + 2)).join("");
    return {
      v: payload.v,
      q: questionSetSignature(),
      a: answers,
      t: payload.completedAt,
      s: [
        payload.scores.S,
        payload.scores.A,
        payload.scores.L,
        payload.scores.T_score,
        payload.scores.T_direction
      ],
      c: payload.code,
      sc: payload.selfCode,
      pc: payload.partnerCode,
      dc: payload.displayCode,
      sdc: payload.selfDisplayCode,
      pdc: payload.partnerDisplayCode
    };
  }

  function unpackAnswerPayload(compact) {
    const answers = {};
    const answerString = String(compact.a || "");
    allQuestions.forEach((question, index) => {
      const digit = Number(answerString[index]);
      answers[question.id] = Number.isFinite(digit) ? digit - 2 : 0;
    });
    return {
      v: compact.v,
      answers,
      completedAt: compact.t || "",
      scores: {
        S: Number(compact.s && compact.s[0]) || 0,
        A: Number(compact.s && compact.s[1]) || 0,
        L: Number(compact.s && compact.s[2]) || 0,
        T_score: Number(compact.s && compact.s[3]) || 0,
        T_direction: Number(compact.s && compact.s[4]) || 0
      },
      code: compact.c || "",
      selfCode: compact.sc || "",
      partnerCode: compact.pc || "",
      displayCode: compact.dc || displayCodeForCode(compact.c || ""),
      selfDisplayCode: compact.sdc || displayCodeForCode(compact.sc || ""),
      partnerDisplayCode: compact.pdc || displayCodeForCode(compact.pc || ""),
      questionSet: compact.q || ""
    };
  }

  function canUseAes() {
    return Boolean(window.crypto && window.crypto.subtle && window.isSecureContext && window.crypto.getRandomValues);
  }

  async function encryptText(text) {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getAesKey();
    const cipher = new Uint8Array(await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(text)));
    return concatBytes(iv, cipher);
  }

  async function decryptText(bytes) {
    const decoder = new TextDecoder();
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    const key = await getAesKey();
    const plain = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return decoder.decode(plain);
  }

  async function getAesKey() {
    const encoder = new TextEncoder();
    const digest = await window.crypto.subtle.digest("SHA-256", encoder.encode(ANSWER_CODE_KEY));
    return window.crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  }

  function xorEncode(text) {
    const encoder = new TextEncoder();
    const payload = JSON.stringify({ p: text, k: checksum(text) });
    return xorBytes(encoder.encode(payload));
  }

  function xorDecode(bytes) {
    const decoder = new TextDecoder();
    const wrapper = JSON.parse(decoder.decode(xorBytes(bytes)));
    if (wrapper.k !== checksum(wrapper.p)) {
      throw new Error("Checksum mismatch");
    }
    return wrapper.p;
  }

  function xorBytes(bytes) {
    const output = new Uint8Array(bytes.length);
    let seed = fnv1a(ANSWER_CODE_KEY);
    for (let index = 0; index < bytes.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      output[index] = bytes[index] ^ (seed & 255) ^ ANSWER_CODE_KEY.charCodeAt(index % ANSWER_CODE_KEY.length);
    }
    return output;
  }

  function checksum(text) {
    return fnv1a(text).toString(16).padStart(8, "0");
  }

  function fnv1a(text) {
    let hash = 0x811c9dc5;
    String(text).split("").forEach((char) => {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    });
    return hash >>> 0;
  }

  function bytesToBase64url(bytes) {
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.slice(index, index + 0x8000));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64urlToBytes(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function concatBytes(first, second) {
    const output = new Uint8Array(first.length + second.length);
    output.set(first, 0);
    output.set(second, first.length);
    return output;
  }

  function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        success ? resolve() : reject(new Error("Copy command failed"));
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  }

  function normalizeResultTypes(data) {
    const normalized = {};
    CODES.forEach((code) => {
      normalized[code] = fallbackType(code);
    });
    const inputTypes = data && data.types;
    if (Array.isArray(data && data.rows)) {
      data.rows.forEach((item) => addType(normalized, item));
    }
    if (Array.isArray(inputTypes)) {
      inputTypes.forEach((item) => addType(normalized, item));
    } else if (inputTypes && typeof inputTypes === "object") {
      Object.keys(inputTypes).forEach((code) => addType(normalized, Object.assign({ code }, inputTypes[code])));
    }
    return normalized;
  }

  function addType(target, item) {
    if (!item || !item.code || !CODES.includes(item.code)) return;
    const merged = Object.assign(fallbackType(item.code), item);
    const roles = rolesForType(merged);
    merged.roles = roles;
    merged.role_candidates = Array.isArray(merged.role_candidates) && merged.role_candidates.length ? merged.role_candidates : roles;
    merged.character_name = merged.character_name || roles[0] || "";
    merged.character_source = merged.character_source || "";
    merged.character_note = merged.character_note || merged.why || merged.notes || "";
    merged.art_key = merged.art_key || merged.code;
    target[item.code] = merged;
  }

  function fallbackType(code) {
    return {
      code,
      title: FALLBACK_TITLES[code] || code,
      description: "这个类型还没有来自 REF.xlsx 的描述，可以在 data/result_types.json 中补充。",
      character_name: "",
      character_source: "",
      character_note: "",
      art_key: code,
      role_candidates: [],
      roles: []
    };
  }

  function normalizeResultProfiles(data) {
    const source = data && data.profiles && typeof data.profiles === "object" ? data.profiles : {};
    return CODES.reduce((profiles, code) => {
      profiles[code] = Object.assign(fallbackProfile(code), source[code] || {});
      return profiles;
    }, {});
  }

  function fallbackProfile(code) {
    const title = FALLBACK_TITLES[code] || code;
    return {
      code,
      title,
      tagline: `${title}：把亲近、行动和距离感组合成自己的关系节奏。`,
      main_profile: "这个类型的长分析还可以继续补充。",
      self_attachment: "你在关系里的给出方式需要结合 S、A、L 和 T 一起看：你如何表达特殊性、如何兑现行动、如何安排长期，都会影响别人读懂你的方式。",
      partner_expectation: "你希望伴侣给你一套能被你感知到的亲近方式：特殊性、行动和时间感最好能落在具体场景里。",
      relationship_gap: "关系差值提醒你：自己给出的方式和期待收到的方式，不一定天然相同。",
      support_overlay_hint: "支持偏好只解释你更吃哪种支持，不改变 SALT 类型。",
      share_text: `我的 SALT 是 ${code} ${title}。`
    };
  }

  function normalizeSupportProfiles(data) {
    const source = data && data.profiles ? data.profiles : DEFAULT_SUPPORT_DATA.profiles;
    return Object.keys(DEFAULT_SUPPORT_DATA.profiles).reduce((profiles, key) => {
      profiles[key] = Object.assign({}, DEFAULT_SUPPORT_DATA.profiles[key], source[key] || {});
      return profiles;
    }, {});
  }

  function normalizeRoleImages(data) {
    const images = data && data.images && typeof data.images === "object" ? data.images : {};
    return Object.keys(images).reduce((map, role) => {
      const normalized = normalizeRoleName(role);
      const src = String(images[role] || "").trim();
      if (normalized && src) {
        map[role] = src;
        map[normalized] = src;
      }
      return map;
    }, {});
  }

  function getType(code) {
    return resultTypes[code] || fallbackType(code);
  }

  function getProfile(code) {
    return resultProfiles[code] || fallbackProfile(code);
  }

  function rolesForType(type) {
    if (!type) return [];
    const seen = new Set();
    const output = [];
    const addRole = (role) => {
      const value = String(role || "").trim();
      const key = normalizeRoleName(value);
      if (!value || seen.has(key)) return;
      seen.add(key);
      output.push(value);
    };
    const addRoles = (roles) => {
      if (Array.isArray(roles)) {
        roles.forEach(addRole);
        return;
      }
      if (typeof roles === "string") {
        roles.split(/\s*(?:\/|、|，|,|；|;)\s*/).forEach(addRole);
      }
    };
    addRoles(type.role_candidates);
    addRoles(type.roles);
    addRoles(type.role_text);
    addRole(type.character_name);
    return output;
  }

  function primaryCharacter(type) {
    const roles = rolesForType(type);
    return (type && type.character_name) || roles[0] || "";
  }

  function characterTextForType(type) {
    if (!type) return "";
    const roles = rolesForType(type);
    if (roles.length) return roles.join(" / ");
    if (type.role_text) return String(type.role_text).trim();
    return String(type.character_name || "").trim();
  }

  function getTypeIllustration(type, code) {
    const artKey = (type && type.art_key) || code;
    const manifestImage = getArtAsset("type_illustrations", artKey, "") || getArtAsset("type_illustrations", code, "");
    if (manifestImage) return manifestImage;
    const roleImage = getTypeRoleImage(type);
    if (roleImage) return roleImage;
    return getArtAsset("result_cards", "default", "") || getArtAsset("avatars", "default", "");
  }

  function getTypeRoleImage(type) {
    return rolesForType(type).reduce((found, role) => found || getRoleImage(role), "");
  }

  function getRoleImage(role) {
    const name = String(role || "").trim();
    return name ? roleImages[name] || roleImages[normalizeRoleName(name)] || "" : "";
  }

  function normalizeRoleName(role) {
    return String(role || "")
      .replace(/\s+/g, "")
      .replace(/[（(].*?[）)]/g, "")
      .trim();
  }

  function mergeManifest(base, override) {
    const output = {};
    Object.keys(base).forEach((category) => {
      output[category] = Object.assign({}, base[category], override && override[category] ? override[category] : {});
    });
    Object.keys(override || {}).forEach((category) => {
      if (!output[category]) output[category] = override[category];
    });
    return output;
  }

  function createInitialState() {
    return {
      current: 0,
      answers: {},
      mode: "intro",
      completedAt: "",
      answerCode: "",
      answerFingerprint: "",
      questionOrder: shuffledQuestionIds(),
      selectedRoles: {},
      questionSet: questionSetSignature()
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      return {
        current: Number.isFinite(parsed.current) ? parsed.current : 0,
        answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
        mode: ["intro", "quiz", "result"].includes(parsed.mode) ? parsed.mode : "intro",
        completedAt: parsed.completedAt || "",
        answerCode: parsed.answerCode || "",
        answerFingerprint: parsed.answerFingerprint || "",
        questionOrder: Array.isArray(parsed.questionOrder) ? parsed.questionOrder : [],
        selectedRoles: parsed.selectedRoles && typeof parsed.selectedRoles === "object" ? parsed.selectedRoles : {},
        questionSet: parsed.questionSet || ""
      };
    } catch (error) {
      return createInitialState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (error) {
      return;
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (error) {
      return;
    }
  }

  function currentQuestion() {
    ensureQuestionOrder();
    return displayQuestions()[state.current] || displayQuestions()[0] || allQuestions[0];
  }

  function displayQuestions() {
    ensureQuestionOrder();
    const byId = new Map(allQuestions.map((question) => [question.id, question]));
    return state.questionOrder.map((id) => byId.get(id)).filter(Boolean);
  }

  function ensureQuestionOrder() {
    const ids = allQuestions.map((question) => question.id);
    const idSet = new Set(ids);
    const currentOrder = Array.isArray(state.questionOrder) ? state.questionOrder.filter((id) => idSet.has(id)) : [];
    if (currentOrder.length === ids.length && new Set(currentOrder).size === ids.length) {
      state.questionOrder = currentOrder;
      return;
    }
    const remaining = ids.filter((id) => !currentOrder.includes(id));
    state.questionOrder = currentOrder.concat(shuffleList(remaining));
  }

  function shuffledQuestionIds() {
    return shuffleList(allQuestions.map((question) => question.id));
  }

  function shuffleList(items) {
    const output = items.slice();
    for (let index = output.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      const temp = output[index];
      output[index] = output[swapIndex];
      output[swapIndex] = temp;
    }
    return output;
  }

  function randomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function sanitizeState() {
    const currentQuestionSet = questionSetSignature();
    if (state.questionSet !== currentQuestionSet) {
      state = createInitialState();
      saveState();
      return;
    }
    const ids = new Set(allQuestions.map((question) => question.id));
    const allowedValues = new Set(scale.map((item) => item.value));
    Object.keys(state.answers).forEach((id) => {
      if (!ids.has(id) || !allowedValues.has(Number(state.answers[id]))) {
        delete state.answers[id];
      } else {
        state.answers[id] = Number(state.answers[id]);
      }
    });
    ensureQuestionOrder();
    const orderedLength = displayQuestions().length || allQuestions.length || 1;
    state.current = Math.max(0, Math.min(orderedLength - 1, Number(state.current) || 0));
    if (!state.selectedRoles || typeof state.selectedRoles !== "object") state.selectedRoles = {};
    Object.keys(state.selectedRoles).forEach((code) => {
      if (!CODES.includes(code) || !rolesForType(getType(code)).includes(state.selectedRoles[code])) {
        delete state.selectedRoles[code];
      }
    });
    if (state.mode === "result" && !isComplete()) {
      state.mode = "quiz";
    }
    if (state.mode === "quiz" && state.current === 0 && Object.keys(state.answers).length === 0) {
      state.mode = "intro";
    }
    if (state.answerFingerprint && state.answerFingerprint !== buildAnswerSignature(state.answers)) {
      state.answerCode = "";
      state.answerFingerprint = "";
    }
    state.questionSet = currentQuestionSet;
    saveState();
  }

  function countAnswered() {
    return allQuestions.filter((question) => Object.prototype.hasOwnProperty.call(state.answers, question.id)).length;
  }

  function isComplete() {
    return allQuestions.length > 0 && countAnswered() === allQuestions.length;
  }

  function buildAnswerSignature(answers) {
    return allQuestions.map((question) => `${question.id}:${Number(answers[question.id])}`).join("|");
  }

  function questionSetSignature() {
    return checksum(allQuestions.map((question) => question.id).join("|"));
  }

  function scoreToPercent(value) {
    return `${((clamp(value) + 100) / 2).toFixed(2)}%`;
  }

  function axisScoreToPercent(value) {
    return `${((100 - clamp(value)) / 2).toFixed(2)}%`;
  }

  function getBandLabel(value) {
    const score = clamp(value);
    if (score >= 70) return "很高";
    if (score >= 30) return "偏高";
    if (score > -30) return "中性";
    if (score > -70) return "偏低";
    return "很低";
  }

  function getGapLabel(value) {
    const gap = clamp(value);
    if (gap > 30) return "更期待对方";
    if (gap > 8) return "略期待对方";
    if (gap < -30) return "更倾向给出";
    if (gap < -8) return "略倾向给出";
    return "接近平衡";
  }

  function roundScore(value) {
    return Math.round(clamp(value));
  }

  function clamp(value, min = -100, max = 100) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(min, Math.min(max, value));
  }

  function cssUrl(path) {
    return `url("${String(path).replace(/\\/g, "/").replace(/"/g, "%22")}")`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 1800);
  }

  window.loadArtManifest = loadArtManifest;
  window.getArtAsset = getArtAsset;
  window.buildAnswerPayload = buildAnswerPayload;
  window.encodeAnswerCode = encodeAnswerCode;
  window.decodeAnswerCode = decodeAnswerCode;
  window.getVisibleAnswerCode = getVisibleAnswerCode;
  window.SALT_DEBUG = {
    calculateResult,
    buildAnswerPayload,
    encodeAnswerCode,
    decodeAnswerCode,
    getVisibleAnswerCode,
    buildShareText,
    buildShareCanvas
  };
})();
