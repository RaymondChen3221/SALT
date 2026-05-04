(function () {
  "use strict";

  const scale = [
    { value: -2, label: "非常不同意" },
    { value: -1, label: "不同意" },
    { value: 0, label: "不确定 / 看情况" },
    { value: 1, label: "同意" },
    { value: 2, label: "非常同意" }
  ];

  const main = [
    { id: "s_self_1", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S1", direction: 1, text: "我会为重要的人保留一些只属于他/她的称呼、表达或小习惯。" },
    { id: "s_self_2", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S2", direction: 1, text: "即使我平时对很多人都友好，我也会让喜欢的人感觉到他/她是不一样的。" },
    { id: "s_self_3", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S3", direction: -1, text: "我觉得亲密关系里没必要刻意区分喜欢的人和普通朋友，大家自然相处就好。" },
    { id: "s_self_4", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S4", direction: 1, text: "如果对方因为我和别人走得近而不安，我愿意给一点温和的确认。" },
    { id: "s_self_5", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S5", direction: -1, text: "我不太在意只属于两个人的小梗、小秘密后来变成大家都知道的东西。" },
    { id: "s_self_6", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S6", direction: 1, text: "对我来说，越重要的人，越应该拥有一些不会被随便分享出去的私密位置。" },
    { id: "s_other_1", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S1", direction: 1, text: "如果对方给我一个固定的小称呼、暗号或专属表达，我会觉得很安心。" },
    { id: "s_other_2", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S2", direction: 1, text: "对方可以对很多人都好，但我希望自己能感到有一块位置是特别留给我的。" },
    { id: "s_other_3", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S3", direction: -1, text: "只要相处舒服，我不太需要确认自己和普通朋友有什么区别。" },
    { id: "s_other_4", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S4", direction: 1, text: "我有点吃醋或想确认位置时，会希望对方别装没看见，而是轻轻接一下。" },
    { id: "s_other_5", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S5", direction: -1, text: "如果对方把原本很像“我们之间”的内容也给别人，我通常不会太受影响。" },
    { id: "s_other_6", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S6", direction: 1, text: "有些话、照片、情绪或故事，我希望对方不要随便带给别人。" },

    { id: "a_self_1", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A1", direction: 1, text: "我答应过的小事，就算做不到，也会提前说明或改期。" },
    { id: "a_self_2", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A2", direction: 1, text: "我在意一个人时，会尽量让对方从具体行为里感觉到，而不是只停在心里。" },
    { id: "a_self_3", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A3", direction: -1, text: "遇到有点重的关系问题时，我常常会先躲过去，之后再解释。" },
    { id: "a_self_4", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A4", direction: 1, text: "我发现自己让对方受伤后，会尽量承认影响，并做一点修复。" },
    { id: "a_self_5", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A5", direction: -1, text: "有时候我觉得自己心里知道就够了，不一定非要把在意做出来。" },
    { id: "a_self_6", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A6", direction: 1, text: "就算我没精力认真回应，也会尽量给一个最小信号，让对方别空等。" },
    { id: "a_other_1", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A1", direction: 1, text: "对方临时做不到说好的事时，我希望他/她能提前告诉我，而不是让我自己猜。" },
    { id: "a_other_2", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A2", direction: 1, text: "比起听对方说“我在意”，我更希望能在行动里看见这种在意。" },
    { id: "a_other_3", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A3", direction: -1, text: "如果对方事后解释自己当时为什么消失，我通常不会太在意他/她之前没有信号。" },
    { id: "a_other_4", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A4", direction: 1, text: "对方让我受伤后，我希望他/她至少承认这件事对我造成了影响。" },
    { id: "a_other_5", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A5", direction: -1, text: "只要我相信对方心里有我，实际行动少一点也没关系。" },
    { id: "a_other_6", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A6", direction: 1, text: "对方接不住我时，我不需要他/她硬撑，但希望有一句“我现在接不住”。" },

    { id: "l_self_1", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L1", direction: 1, text: "我喜欢一个人后，会自然把对方放进未来几个月甚至几年的设想里。" },
    { id: "l_self_2", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L2", direction: 1, text: "一段关系让我认真后，它会影响我的时间安排和生活结构。" },
    { id: "l_self_3", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L3", direction: -1, text: "我更倾向于先看当下相处舒不舒服，不太想提前把关系想得很远。" },
    { id: "l_self_4", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L4", direction: 1, text: "我会让喜欢的人逐渐进入我的生活场景、兴趣、计划和日常。" },
    { id: "l_self_5", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L5", direction: -1, text: "即使一段关系很重要，我也不太会因此调整自己的生活结构。" },
    { id: "l_self_6", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L6", direction: 1, text: "我会在意重要节点，比如生日、约定、纪念性的日子。" },
    { id: "l_other_1", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L1", direction: 1, text: "对方喜欢我后，我希望自己也会出现在对方未来一段时间的设想里。" },
    { id: "l_other_2", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L2", direction: 1, text: "如果对方认真对待我，我希望这段关系也会影响他/她的时间安排和生活结构。" },
    { id: "l_other_3", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L3", direction: -1, text: "只要当下相处舒服，对方有没有把我放进未来并不重要。" },
    { id: "l_other_4", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L4", direction: 1, text: "我希望对方会让我逐渐进入他/她的兴趣、日常、生活场景或计划里。" },
    { id: "l_other_5", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L5", direction: -1, text: "如果对方因为我调整生活计划，我反而会觉得压力很大，希望他/她别这样。" },
    { id: "l_other_6", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L6", direction: 1, text: "我希望对方会在意重要节点，比如生日、约定、纪念性的日子。" }
  ];

  const support = [
    { id: "support_practical_1", section: "support", support: "practical", supportLabel: "实用托底", perspective: null, pair: "P1", direction: 1, text: "别人帮我解决现实问题、给资源、推进事情，会让我很有安全感。" },
    { id: "support_practical_2", section: "support", support: "practical", supportLabel: "实用托底", perspective: null, pair: "P2", direction: 1, text: "比起听我说很多话，我有时更希望对方能实际帮我做点事。" },
    { id: "support_emotional_1", section: "support", support: "emotional", supportLabel: "情绪理解", perspective: null, pair: "E1", direction: 1, text: "我最需要的是有人理解我、听我说、不要急着评判我。" },
    { id: "support_emotional_2", section: "support", support: "emotional", supportLabel: "情绪理解", perspective: null, pair: "E2", direction: 1, text: "比起直接替我解决问题，我更希望对方先接住我的情绪。" },
    { id: "support_creative_1", section: "support", support: "creative", supportLabel: "共同创作", perspective: null, pair: "C1", direction: 1, text: "如果对方认真参与我的兴趣、作品或创作，我会觉得很被理解。" },
    { id: "support_creative_2", section: "support", support: "creative", supportLabel: "共同创作", perspective: null, pair: "C2", direction: 1, text: "比起单纯安慰我，我更喜欢对方和我一起做出一点具体的东西。" },
    { id: "support_presence_1", section: "support", support: "presence", supportLabel: "低压在场", perspective: null, pair: "N1", direction: 1, text: "我不一定需要对方解决什么，只要他/她稳定在场就会安心。" },
    { id: "support_presence_2", section: "support", support: "presence", supportLabel: "低压在场", perspective: null, pair: "N2", direction: 1, text: "对方给我一点低压陪伴，比给我很多建议更有用。" }
  ];

  window.SALT_QUESTIONS = {
    version: "v4",
    scale,
    main,
    support,
    all: main.concat(support)
  };
})();
