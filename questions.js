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
    { id: "s_self_3", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S3", direction: 1, text: "我会为腾出时间与对方相处而牺牲独处，休息，工作或者爱好的时间" },
    { id: "s_self_4", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S4", direction: 1, text: "如果对方因为我和别人走得近而不安，我愿意主动澄清和公开关系。" },
    { id: "s_self_5", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S5", direction: -1, text: "我可能会把两个人之间的专属梗和相处细节与其他朋友分享。" },
    { id: "s_self_6", section: "main", axis: "S", axisLabel: "特殊性", perspective: "self", perspectiveLabel: "我会给出", pair: "S6", direction: 1, text: "对我来说，和对方相处比和朋友相处要重要的多" },
    { id: "s_other_1", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S1", direction: 1, text: "我喜欢对方给我起爱称或者奇奇怪怪的备注" },
    { id: "s_other_2", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S2", direction: 1, text: "对方对待我和TA的朋友有很大不同，无论是我还是旁人都能一眼看出。" },
    { id: "s_other_3", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S3", direction: 1, text: "我有时想让TA放下手中的一切事务来关心我。" },
    { id: "s_other_4", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S4", direction: 1, text: "我希望对方能看出来我吃醋了。" },
    { id: "s_other_5", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S5", direction: -1, text: "我无所谓对方公开谈论我们之间的相处细节。" },
    { id: "s_other_6", section: "main", axis: "S", axisLabel: "特殊性", perspective: "other", perspectiveLabel: "我期待对方", pair: "S6", direction: 1, text: "我宁愿对方花更多的时间在我身上，而不是TA的其他朋友" },

    { id: "a_self_1", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A1", direction: 1, text: "我把答应对方的事当做第一要务处理。" },
    { id: "a_self_2", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A2", direction: 1, text: "我有时其实不想对TA希望我做的事作出实质性努力。" },
    { id: "a_self_3", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A3", direction: -1, text: "遇到有点重的关系问题时，我常常会先躲过去，之后再解释。" },
    { id: "a_self_6", section: "main", axis: "A", axisLabel: "兑现力", perspective: "self", perspectiveLabel: "我会给出", pair: "A6", direction: 1, text: "就算我没精力认真回应，也会提前给TA一个信号。" },
    { id: "a_other_1", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A1", direction: -1, text: "对方承诺了一件事后，对我来说这份心比实际付出的努力更重要。" },
    { id: "a_other_2", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A2", direction: 1, text: "比起听对方说“我在意”，我更希望能在行动里看见这种在意。" },
    { id: "a_other_3", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A3", direction: 1, text: "对于冷暴力和不解释理由的情绪发泄，我会极度不知所措。" },
    { id: "a_other_5", section: "main", axis: "A", axisLabel: "兑现力", perspective: "other", perspectiveLabel: "我期待对方", pair: "A6", direction: 1, text: "能够让我掌握TA所有的安排和心情。" },

    { id: "l_self_1", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L1", direction: 1, text: "我喜欢一个人后，会自然把对方放进未来几个月甚至几年的设想里。" },
    { id: "l_self_2", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L2", direction: 1, text: "我会想象跟对方一起生活的点点滴滴。。" },
    { id: "l_self_3", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L3", direction: -1, text: "当下的感觉，氛围和冲动相比起以后日常相处会不会起冲突这类问题更重要。" },
    { id: "l_self_4", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L4", direction: 1, text: "我会让喜欢的人逐渐进入我的生活场景、兴趣、计划和日常。" },
    { id: "l_self_5", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L5", direction: -1, text: "即使一段关系很重要，我也不太会因此调整自己的生活结构。" },
    { id: "l_self_6", section: "main", axis: "L", axisLabel: "长程性", perspective: "self", perspectiveLabel: "我会给出", pair: "L6", direction: 1, text: "我能记得住TA的生日和纪念日，并总是会为此提前准备。" },
    { id: "l_other_1", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L1", direction: 1, text: "相比今天吃什么这类话题，我喜欢听TA跟我谈论以后的共同生活计划。" },
    { id: "l_other_2", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L2", direction: 1, text: "对方会加入与我共同的长期活动，而不是一时兴起后退出。" },
    { id: "l_other_3", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L3", direction: -1, text: "我无所谓，甚至希望对方不要在计划未来的时候把我考虑进去。" },
    { id: "l_other_4", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L4", direction: 1, text: "我希望对方会让我逐渐进入他/她的兴趣、日常、生活场景或计划里。" },
    { id: "l_other_5", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L5", direction: -1, text: "如果对方因为我调整生活计划，我反而会觉得压力很大，希望他/她别这样。" },
    { id: "l_other_6", section: "main", axis: "L", axisLabel: "长程性", perspective: "other", perspectiveLabel: "我期待对方", pair: "L6", direction: 1, text: "在人生的节点，比如毕业典礼，我会希望对方出现。" }
  ];

  const support = [
    { id: "support_practical_1", section: "support", support: "practical", supportLabel: "实用托底", perspective: null, pair: "P1", direction: 1, text: "别人帮我解决现实问题、给资源、推进事情，会让我很有安全感。" },
    { id: "support_practical_2", section: "support", support: "practical", supportLabel: "实用托底", perspective: null, pair: "P2", direction: 1, text: "比起听我说很多话，我有时更希望对方能实际帮我做点事。" },
    { id: "support_emotional_1", section: "support", support: "emotional", supportLabel: "情绪理解", perspective: null, pair: "E1", direction: 1, text: "在困难面前，比起分析和提出方案，我最需要的是有人听我说、不要评判我。" },
    { id: "support_emotional_2", section: "support", support: "emotional", supportLabel: "情绪理解", perspective: null, pair: "E2", direction: 1, text: "如果处理情绪会耽误解决矛盾的话，我会先思考如何处理矛盾。" },
    { id: "support_creative_1", section: "support", support: "creative", supportLabel: "共同创作", perspective: null, pair: "C1", direction: 1, text: "如果对方认真参与我的兴趣、作品或创作，我会觉得很被理解。" },
    { id: "support_creative_2", section: "support", support: "creative", supportLabel: "共同创作", perspective: null, pair: "C2", direction: 1, text: "比起单纯安慰我，我更喜欢对方和我一起做出一点具体的东西。" },
    { id: "support_presence_1", section: "support", support: "presence", supportLabel: "低压在场", perspective: null, pair: "N1", direction: 1, text: "我不一定需要对方解决什么，但是我需要TA的时候TA必须出现。" },
    { id: "support_presence_2", section: "support", support: "presence", supportLabel: "低压在场", perspective: null, pair: "N2", direction: 1, text: "对方总是能秒回，比给我很多建议更有用。" }
  ];

  window.SALT_QUESTIONS = {
    version: "v4",
    scale,
    main,
    support,
    all: main.concat(support)
  };
})();
