import type { StoryCampaignTranslations, StoryMissionTranslations, StoryTextTranslations } from "./story-catalog";

type Localized = Pick<StoryTextTranslations, "en" | "zh">;
interface ChoiceCopy { label: Localized; consequence: Localized }
interface MissionCopy extends StoryMissionTranslations {
  scenes: Localized[];
  choices: ChoiceCopy[];
}
interface CampaignCopy {
  campaign: StoryCampaignTranslations;
  missions: Record<string, MissionCopy>;
}

const text = (en: string, zh: string): Localized => ({ en, zh });

export const STORY_TRANSLATIONS: Record<"MAJAPAHIT" | "PAJAJARAN", CampaignCopy> = {
  MAJAPAHIT: {
    campaign: {
      title: text("The Crown at the Edge of an Oath", "誓约尽头的王冠"),
      subtitle: text("From Tarik Forest to Amukti Palapa, unity must be won—and answered for.", "从塔里克森林到阿姆克蒂·帕拉帕，团结需要争取，也需要承担责任。"),
    },
    missions: {
      "majapahit-royal-council": {
        title: text("A Kingdom Yet Unnamed", "尚未命名的王国"),
        intro: text("Singhasari has fallen. Raden Wijaya survives through wit, alliances, and patience. In Tarik Forest, a new kingdom is still only land worth fighting for.", "新柯沙里已然覆灭。拉登·维查雅凭借机智、盟友与耐心活了下来。在塔里克森林，一座新王国仍只是一片需要用奋斗守住的土地。"),
        opponentTitle: text("Jayakatwang", "查雅卡旺"),
        objective: text("Choose how to unite the refugees and allies before facing Daha's forces.", "选择如何团结流亡者与盟友，再迎战达哈军队。"),
        ending: text("Daha fell, and Yuan forces left Java after Wijaya turned against them. Victory opened the way to Majapahit; now the promises made to allies must be kept.", "达哈陷落后，维查雅转而击退元军，迫使他们离开爪哇。胜利为满者伯夷打开了道路；如今，盟友们等待着他兑现承诺。"),
        scenes: [
          text("Night hid the road out of Singhasari. Smoke still covered the horizon as Raden Wijaya and his small company crossed the river toward Madura.", "夜色遮住了逃离新柯沙里的道路。浓烟仍笼罩天际，拉登·维查雅带着一小队人渡河前往马都拉。"),
          text("We lost the palace, not our memory. While anyone still walks beside us, the kingdom has not ended.", "我们失去的是王宫，不是记忆。只要还有人愿意与我们同行，王国就没有终结。"),
          text("Wiraraja offers shelter and a way back. But he asks for a promise: if you win the throne, Madura must not be forgotten.", "维拉拉贾愿意提供庇护与归来之路，但他要求一个承诺：若你夺回王位，绝不可忘记马都拉。"),
          text("As Daha's army drew near, help arrived from across the sea with plans of its own. At the council table, allies and threats flew the same banners.", "达哈军逼近之际，海那边的援军也带着自己的盘算而来。谈判桌前，盟友与威胁竟打着相同的旗号。"),
          text("I will accept their help to defeat Jayakatwang. After that, this land must choose its own fate.", "我会借助他们的力量击败查雅卡旺。此后，这片土地必须由自己决定命运。"),
          text("Bitter fruit grew in Tarik's soil. Refugees built their first homes and named the place Majapahit, not knowing what the name would cost them.", "苦涩的果实长在塔里克的土地上。流亡者建起第一批家园，将此地命名为满者伯夷，却不知这个名字将让他们付出什么。"),
          text("Tomorrow we face Daha. Today, make sure everyone knows they are fighting for a home that may one day belong to all.", "明日我们将迎战达哈。今天，要让每个人都明白，他们是在为一个终将属于众人的家园而战。"),
        ],
        choices: [
          { label: text("Bind allies with an equal pledge", "以平等誓约结盟"), consequence: text("Madura and Wijaya's followers will expect the promise to be honored after victory.", "胜利之后，马都拉与维查雅的追随者会要求兑现承诺。") },
          { label: text("Place the army under one command", "统一军队指挥"), consequence: text("The army will move faster, but the allies will watch who receives the honor.", "军队行动会更迅速，但盟友会留意功劳最终归于谁。") },
        ],
      },
      "majapahit-rangga-lawe": {
        title: text("The Oath at Tuban", "图班之誓"),
        intro: text("In the kingdom's first years, victory could not answer one question: who would be heard when old allies felt forgotten? The Pararaton's account of Rangga Lawe's revolt becomes the spark for this chapter.", "王国初建的岁月里，胜利无法回答一个问题：当旧日盟友觉得自己遭到遗忘，谁会倾听？《帕拉拉顿》中朗加·拉韦的叛乱，成为本章的火种。"),
        opponentTitle: text("Rangga Lawe", "朗加·拉韦"),
        objective: text("Face Rangga Lawe and defend the kingdom without erasing the service of its allies.", "迎战朗加·拉韦，守护王国，也不抹去盟友曾立下的功劳。"),
        ending: text("The revolt was quelled, but victory alone could not restore trust. A new generation would inherit a kingdom still learning how to rule.", "叛乱平息了，但胜利本身无法重建信任。新一代继承的，是一个仍在学习如何治理的王国。"),
        scenes: [
          text("Tuban's harbor bustled with ships and rumors. Among the pepper sacks, an envoy carried a grievance that had become a challenge.", "图班港船只往来，流言四起。胡椒袋之间，一名使者带来的怨言已经变成了挑战。"),
          text("I gave my strength and name for this throne. Now those who came later stand closer to the king.", "我曾为这王位献出力量与名声。如今，那些后来者却站得比我更靠近国王。"),
          text("I will not erase what you did for us. But a kingdom cannot be built from debts that are forever called in.", "我不会抹去你为我们所做的一切。但王国不能建立在永远被追讨的旧债之上。"),
          text("The commanders look to you. Reject Rangga Lawe and the army may split; grant every demand and every loyalty will name its price.", "将领们都望向你。拒绝朗加·拉韦，军队或将分裂；答应所有要求，每份忠诚都可能开出价码。"),
          text("Do not answer only as a king. Answer as someone who once needed help.", "别只以国王的身份回答。也以一个曾经需要帮助之人的身份回答。"),
          text("Negotiation could not contain the anger. Dust rose on Tuban's road; those who once fought together now faced each other.", "谈判没能压住怒火。图班路上尘土飞扬，曾并肩作战的人如今彼此对阵。"),
          text("Do not let victory make us forget how this kingdom began. Face him, but do not dishonor those who follow him.", "别让胜利使我们忘记王国如何建立。迎战他，但不要羞辱追随他的人。"),
        ],
        choices: [
          { label: text("Hear his grievance before everyone", "当众听取他的申诉"), consequence: text("The commanders will know their grievances can reach the court, even if the king's answer may disappoint them.", "将领们会知道自己的不满能传到朝廷，即使国王的答复未必让人满意。") },
          { label: text("Restore order first", "先恢复秩序"), consequence: text("The road will be safe again, but Tuban's families will wait for proof that order also means justice.", "道路会重新安定，但图班百姓仍会等待证据，证明秩序也意味着公正。") },
        ],
      },
      "majapahit-sadeng-keta": {
        title: text("Two Eastern Gates", "东方的两道关隘"),
        intro: text("In 1331, under Tribhuwana's rule, news from Sadeng and Keta tested the kingdom's ability to move its forces without losing the trust of distant communities.", "1331年，特里布瓦娜统治时期，萨登与克塔的消息考验着王国：如何调动军队，同时不失去远方居民的信任。"),
        opponentTitle: text("Commanders of Sadeng and Keta", "萨登与克塔的将领"),
        objective: text("Win the battle at the eastern gates while keeping the local people on your side.", "赢下东方关隘之战，同时争取当地居民的支持。"),
        ending: text("The Nagarakretagama recalls Sadeng and Keta during the years Mada bore great responsibility. Victory raised his name—and brought him closer to the oath that would shake the court.", "《爪哇史颂》记载了马达肩负重任时期的萨登与克塔之事。胜利令他声名鹊起，也让他更接近那场将震动朝廷的誓言。"),
        scenes: [
          text("A rain-soaked map lay before the queen. Two red marks stood far apart as commanders argued over roads, supplies, and leadership.", "一幅被雨水打湿的地图铺在女王面前。两个红色标记相距甚远，将领们争论着道路、补给与统帅人选。"),
          text("A kingdom is not strong because its map is filled with colors. It is strong when people at its far edge trust the palace to answer their call.", "地图涂满颜色，并不代表王国强大。边远之地的百姓相信宫廷会回应他们的求援，王国才真正强大。"),
          text("Sadeng and Keta are not marks on a palm-leaf map. We must learn who stands there and why they resist.", "萨登与克塔不是贝叶地图上的符号。我们必须弄清那里的人是谁，又为何抵抗。"),
          text("The eastern road was mud. A supply bearer fell behind, reporting that the local granaries had been emptied before the army arrived.", "东行的道路泥泞不堪。一名运粮人落在后面，说军队抵达前，当地粮仓已经被搬空。"),
          text("Do not use the needs of war to justify taking the people's food. Find another route—or victory will leave famine behind.", "不要以战争所需为借口夺走百姓的粮食。另寻道路，否则胜利之后留下的将是饥荒。"),
          text("I will clear the way. But our report to the palace must name the cost, not only the places we conquered.", "我会为军队开路。但呈给宫廷的报告必须写明代价，不能只写下被征服的地名。"),
          text("Drums answered the fog. When the last gate opened, news of victory raced home faster than the weary army.", "战鼓回应着迷雾。最后一道关隘开启时，胜利的消息比疲惫的军队更快传回王都。"),
        ],
        choices: [
          { label: text("Secure the supply route first", "先确保补给路线"), consequence: text("The army will move more slowly, but the people will keep their harvest stores.", "军队会走得更慢，但百姓能够保住粮仓。") },
          { label: text("Push the army toward the gates", "率军直逼关隘"), consequence: text("The attack will gain momentum, but the palace will be asked what victory cost.", "进攻会占得先机，但宫廷将被追问胜利付出了什么代价。") },
        ],
      },
      "majapahit-palapa-oath": {
        title: text("The Oath That Shook the Court", "震动朝堂的誓言"),
        intro: text("After success in the east, Gajah Mada stood before the court. Remembered through the Pararaton, the Palapa Oath becomes a political promise that divides the hall—not a magic phrase that settles every dispute.", "东征得胜后，伽查·马达站上朝堂。《帕拉拉顿》记载的帕拉帕誓言，在本章中成为一道撕裂朝堂的政治承诺，而非解决一切纷争的咒语。"),
        opponentTitle: text("The Challenging Commander", "质疑誓言的将领"),
        objective: text("Stand by the oath and prove that determination can walk beside justice.", "坚守誓言，并证明决心能够与公正并行。"),
        ending: text("The oath spread from the court to the harbor. Yet the same words could mean different things to people who lived far from the throne.", "誓言从朝堂传到港口。然而，对远离王座的人们而言，同一句话也可能有着截然不同的含义。"),
        scenes: [
          text("The hall was thick with damp cloth and road dust. Officials awaited their rewards, but Gajah Mada stepped forward asking for nothing.", "朝堂里满是潮湿衣袍与旅途尘土。官员们等着分封赏赐，伽查·马达却走到中央，什么也没有索取。"),
          text("I will not enjoy palapa before this great purpose is fulfilled. Let this oath bind me before it binds anyone else.", "在宏愿实现之前，我不会享用帕拉帕。让这誓言先约束我，再约束其他人。"),
          text("Laughter rose from one side of the hall. Some called it impossible; others feared the words might one day demand too great a sacrifice.", "朝堂一侧传来笑声。有人认为这不可能，也有人担心这番话终有一天会要求人们付出过大的牺牲。"),
          text("An oath can kindle courage. But who will keep one official's resolve from becoming a burden on all the people?", "誓言能够点燃勇气。但谁来防止一名官员的决心变成全体百姓的负担？"),
          text("If this oath belongs only to me, it will die with me. I want every region to have a reason to build the future together.", "若这誓言只属于我，它也会随我而逝。我希望每个地方都有理由共同建设未来。"),
          text("Outside, soldiers repeated the words they had heard. In the market, traders wondered whether unity meant safer roads—or heavier tribute.", "宫外，士兵们重复着听来的誓言。集市上，商人们则在问：团结意味着道路更安全，还是贡赋更沉重？"),
          text("Prove the oath through choices that make people want to belong—not through fear that makes them afraid to leave.", "用让人愿意留下的决定证明誓言，而非让人因恐惧而不敢离开。"),
        ],
        choices: [
          { label: text("Answer doubt with resolve", "以坚定回应质疑"), consequence: text("The soldiers will remember your courage, while the officials wait to learn where you will draw the line.", "士兵会记住你的勇气，官员们则等着看你会把界限划在哪里。") },
          { label: text("Invite the regions to shape a shared goal", "邀各地共同制定目标"), consequence: text("Unity will take longer, but the envoys will know their future is part of the discussion.", "团结之路会更漫长，但各地使者会知道，他们的未来也在商议之中。") },
        ],
      },
      "majapahit-pasunda-bubat": {
        title: text("Bubat: Two Courts, Two Memories", "布巴特：两座宫廷，两种记忆"),
        intro: text("The story of Bubat reaches us through different manuscript traditions. This chapter presents the diplomatic crisis from both sides and leaves room for historical uncertainty.", "关于布巴特的记载来自不同的文献传统。本章从双方视角呈现外交危机，并保留历史的不确定性。"),
        opponentTitle: text("Prabu Maharaja Linggabuana", "林加布阿纳王"),
        objective: text("Face the Bubat crisis and decide whether negotiation can still save honor.", "面对布巴特危机，决定谈判是否还能挽回尊严。"),
        ending: text("Bubat left a wound in Javanese and Sundanese memory. Sources tell different versions; victory in battle could not undo the failure of diplomacy.", "布巴特在爪哇与巽他人的记忆中留下创伤。史料说法各异，而战场上的胜利无法弥补外交的失败。"),
        scenes: [
          text("The Sundanese party reached Bubat carrying banners and hopes of marriage. In Trowulan, court officials argued over ceremony; a word about rank became an invisible divide.", "巽他使团带着旗帜与联姻的期望抵达布巴特。特罗乌兰的官员争论礼仪，一句关于身份的话筑起了无形的隔阂。"),
          text("We came as one family to welcome another. Do not greet us as a land surrendering itself.", "我们以迎亲家人的身份而来。请不要把我们当作前来归降的一方。"),
          text("I invited them to unite two houses, not to test which one stands higher.", "我邀请他们，是为了联结两个家族，不是为了比较谁高谁低。"),
          text("If we yield on ceremony, our allies may call it weakness. If we force the issue, they will leave carrying a wound.", "若我们在礼仪上退让，盟友或许会视作软弱；若强迫对方，他们离去时便会带着伤痛。"),
          text("An open field lay between the two courts. A letter came too late; its messenger fell before reaching the gate.", "两座宫廷之间横着一片旷野。信件来得太迟，送信人还未抵达城门便坠马倒下。"),
          text("Stop the drums. Do not let others decide in my name what my honor requires.", "停止击鼓。不要让别人代我决定我的尊严意味着什么。"),
          text("The order came after the ranks had begun to move. History would remember this day in different stories; on the field, people heard names called—and unanswered.", "命令传来时，队伍已经开始行动。后世会以不同故事记住这一天；而战场上的人只听见呼喊一个个名字，却无人回应。"),
        ],
        choices: [
          { label: text("Open a path for one last negotiation", "为最后一次谈判开路"), consequence: text("Some will step back from the ranks; others will believe honor has already been wounded too deeply.", "有人会退出队列，也有人会认为尊严已受重创，难以挽回。") },
          { label: text("Uphold the court's protocol", "坚持宫廷礼制"), consequence: text("The court will stand firm, but this decision will outlive the ceremony.", "宫廷会显得立场坚定，但这项决定的影响将远超一场仪式。") },
        ],
      },
      "majapahit-nagarakretagama": {
        title: text("A Kingdom in a Kakawin", "诗篇中的王国"),
        intro: text("In 1365, Prapanca composed the Desawarnana, later widely known as the Nagarakretagama. Behind the courtly praise, a young copyist asks whose voices are missing from the tale of glory.", "1365年，普拉潘查完成《德萨瓦尔纳纳》，后世更熟知其名为《爪哇史颂》。在宫廷颂歌背后，一名年轻抄写员追问：辉煌故事中遗漏了谁的声音？"),
        opponentTitle: text("The Palace Manuscript Keeper", "宫廷典籍守护者"),
        objective: text("Protect the manuscript and decide how a tale of glory can make room for forgotten voices.", "保护典籍，并决定辉煌叙事如何为被遗忘的声音留出位置。"),
        ending: text("The kakawin was completed in 1365, after Gajah Mada's time. Its courtly praise describes a vast world; its silences remind us to ask who could not speak.", "这部诗篇于伽查·马达时代之后的1365年完成。宫廷颂词描绘了广阔世界，而其中的沉默提醒我们追问：谁未能开口？"),
        scenes: [
          text("A light rain fell in the monastery courtyard. Mpu Prapanca arranged palm leaves; every place-name carried the sound of wheels, prayers, markets, and distant journeys.", "细雨落在寺院庭院。姆普·普拉潘查整理着棕榈叶，每个地名都带着车轮、祈祷、集市与远行的回响。"),
          text("I write of this land as seen through travel and memory. Yet no kakawin can hold every voice.", "我写下旅途与记忆中的这片土地。然而，没有一首诗能容纳所有人的声音。"),
          text("If what hurts is left unwritten, does it stop being part of this kingdom?", "如果痛苦没有被写下，它就不再属于这个王国了吗？"),
          text("The leaves named cities, mountains, shrines, and royal journeys. At the market, a mother waited for a child sent on a duty he had never chosen.", "棕榈叶记下城池、山峦、圣地与王室行旅。集市上，一位母亲等待着孩子归来；那份差事从未由他选择。"),
          text("Praise may strengthen a kingdom, but a ruler must also hear what is never sung in the court.", "赞颂能够巩固王国，但统治者也必须听见那些从未在朝堂唱出的声音。"),
          text("Let readers remember that a kingdom is wider than its palace walls. The omitted names still live in those who carry them.", "让读者记住，王国远比宫墙广阔。被遗漏的名字，仍活在那些承载它们的人心中。"),
          text("Roll up the leaves. Sails are returning on the horizon; one seat in the court remains empty, and Gajah Mada's oath enters a chapter he will not witness.", "卷起棕榈叶。天际的船帆正返航，朝堂中有一席空着，伽查·马达的誓言也进入了他再无法见证的篇章。"),
        ],
        choices: [
          { label: text("Preserve the records left out of the praise", "保存颂歌之外的记述"), consequence: text("The copyists will keep a broader story, even if some at court dislike it.", "抄写员将保存更全面的故事，尽管宫廷中有人并不喜欢。") },
          { label: text("Give priority to a unifying account", "优先记录团结王国的故事"), consequence: text("The court will more readily accept the manuscript, but readers must seek other voices beyond its pages.", "宫廷会更容易接受这部典籍，但读者必须到书页之外寻找其他声音。") },
        ],
      },
      "majapahit-amukti-palapa": {
        title: text("Amukti Palapa", "阿姆克蒂·帕拉帕"),
        intro: text("The final night gathers every trace: Tarik Forest, Tuban Road, the eastern gates, the court, and Bubat's field. This cinematic ending imagines the oath as a legacy that must be answered for.", "最后一夜汇聚了所有足迹：塔里克森林、图班之路、东方关隘、宫廷与布巴特平原。这段电影式结局将誓言想象成一份必须承担责任的遗产。"),
        opponentTitle: text("The Shadow of the Oath", "誓言之影"),
        objective: text("Defeat the Shadow of the Oath and bring Majapahit's journey to its end.", "击败誓言之影，为满者伯夷的旅程画上句点。"),
        endingTitle: text("Amukti Palapa: An Oath Becomes a Horizon", "阿姆克蒂·帕拉帕：誓言化作天际"),
        ending: text("Dawn spreads across the sea. Gajah Mada is gone, but his oath is still told. You now understand that the greatest legacy is not a conquered map, but a future people choose to guard together.", "黎明铺展在海面。伽查·马达已逝，他的誓言却仍被传颂。你终于明白，最伟大的遗产不是征服的疆域，而是人们愿意共同守护的未来。"),
        scenes: [
          text("The screen went dark. River water became the sound of waves, then drums. Before you stood the shadow of every promise made in the kingdom's name.", "画面陷入黑暗。河水声化作海浪，继而变成战鼓。所有以王国之名许下的承诺，都化作一道阴影站在你面前。"),
          text("I swore for the kingdom I hoped to build. I could never know how every person would remember it.", "我为自己希望建立的王国立誓，却无法知道每个人最终会如何记住这份誓言。"),
          text("The shadow became a faceless commander. Names of those asked to sacrifice for unity were carved into its shield.", "阴影化作一名无面将领。那些曾被要求为团结牺牲的人，名字刻在它的盾牌上。"),
          text("Do not ask only whether we won. Ask who still felt they had a future after victory.", "不要只问我们是否获胜。也要问，胜利之后，谁仍觉得自己拥有未来。"),
          text("If this oath still lives, let it live as responsibility—not a chain that forces, nor praise that forgets the wound.", "若这誓言仍然存在，就让它成为责任，而不是强迫人的锁链，也不是遗忘伤痛的赞歌。"),
          text("The drums stopped. Banners no longer stood in a single line; some drew near and some kept their distance, all beneath the same sun.", "战鼓停息。天际的旗帜不再排成一列，有些靠近，有些保持距离，却都沐浴在同一轮太阳之下。"),
          text("Light broke through the sails. Amukti Palapa did not end in perfect conquest, but in a question passed on: what is unity if every voice does not help guard it?", "阳光穿过帆影。阿姆克蒂·帕拉帕并未以完美征服收场，而是留下一个世代相传的问题：若没有每种声音共同守护，团结又意味着什么？"),
        ],
        choices: [],
      },
    },
  },
  PAJAJARAN: {
    campaign: {
      title: text("Footsteps Through Pakuan's Mist", "穿越巴库安迷雾的足迹"),
      subtitle: text("Follow the roads, treaties, and memories that carried Pakuan through changing times.", "沿着道路、盟约与记忆，走过巴库安的时代变迁。"),
    },
    missions: {
      "pajajaran-bujangga-maniks-journey": {
        title: text("The Road Bujangga Recorded", "布扬加记录的道路"),
        intro: text("An Old Sundanese travel account opens the campaign. Bujangga Manik, a prince who chose the road, crossed Java and Bali; his notes became a map for generations to come.", "一部古巽他游记开启了这段旅程。选择远行的王子布扬加·马尼克走过爪哇与巴厘岛，他的记录成为后世的地图。"),
        opponentTitle: text("The Mountain Road Keeper", "山路守卫"),
        objective: text("Help Bujangga Manik decide what to record so its roads and people will not be forgotten.", "帮助布扬加·马尼克决定记录什么，让道路与沿途百姓不被遗忘。"),
        ending: text("The travel notes became one of the clearest windows into the Old Sundanese world. Years later, the story turns to Pakuan, where the kingdom's legacy is at stake.", "这份游记成为了解古巽他世界最清晰的窗口之一。多年后，故事回到巴库安，王国的遗产正面临考验。"),
        scenes: [
          text("Morning lifted the mist over Pakuan. Bujangga Manik left the gate without a royal escort, carrying simple provisions and a curiosity heavier than a sword.", "晨光驱散了巴库安城门上的薄雾。布扬加·马尼克没有带随从离开，只带着简单行囊，以及比剑更沉重的好奇心。"),
          text("From the palace, the world looks like borders on a map. I want to walk until each place has a voice and a face.", "从王宫望去，世界仿佛只是地图上的边界。我想一路走下去，直到每个地方都有声音与面孔。"),
          text("The road climbed past forests, rivers, and villages. Every stop showed him that a kingdom is made of lives the court cannot always see.", "道路穿过森林、河流与村庄。每一次停留都让他明白，王国由许多朝堂无法看见的生活构成。"),
          text("Record this place carefully. The road you travel also connects people who may never meet their ruler.", "请谨慎记录此地。你走过的道路，也连接着那些可能一生都见不到君王的人。"),
          text("I will write what I see, not only the names the court wishes to hear.", "我要写下亲眼所见，而不只是宫廷想听见的名字。"),
          text("His journey crossed Java and reached Bali. When he returned, the map in his mind stretched far beyond Pakuan's walls.", "他的旅程横越爪哇，抵达巴厘。归来时，他心中的地图已远远超出巴库安的城墙。"),
          text("When roads change and banners turn, someone may still find a way home through these names.", "当道路改变、旗帜更替，仍会有人循着这些地名找到回家的路。"),
        ],
        choices: [
          { label: text("Record place-names and routes", "记录地名与路线"), consequence: text("Future travelers can follow the trail, though the reasons people live there may remain untold.", "后来的旅人能够循迹而行，但当地人为何在此生活，或许仍未被记录。") },
          { label: text("Record the people he meets", "记录沿途遇见的人"), consequence: text("The people's voices will shape the manuscript, while some roads may survive only in their memories.", "百姓的声音将成为典籍的核心，但有些道路或许只留在他们的记忆中。") },
        ],
      },
      "pajajaran-pakuan-whispers": {
        title: text("Whispers in Pakuan", "巴库安的密语"),
        intro: text("Near the end of Sri Baduga Maharaja's reign, reports from ports and borders arrived together. A scribe found an unregistered page—not a prophecy, but a report deliberately kept from the court.", "斯里·巴杜加·马哈拉贾晚年，港口与边境的消息接踵而至。一名书记发现一页未登记的文件：那不是预言，而是一份被故意隐瞒的报告。"),
        opponentTitle: text("The Palace Archive Keeper", "宫廷档案守卫"),
        objective: text("Choose how to reveal the port report without breaking trust in Pakuan.", "选择如何揭露港口报告，同时不摧毁巴库安的信任。"),
        ending: text("The report changed how Pakuan viewed its port. Before long, a treaty would bring a foreign power to Sunda Kalapa.", "这份报告改变了巴库安看待港口的方式。不久之后，一纸盟约将把外来势力带到巽他卡拉帕。"),
        scenes: [
          text("Morning mist hung over Pakuan's road. A palace scribe carried a page from the archive, marked by rain and a broken seal.", "晨雾笼罩着巴库安的道路。一名宫廷书记从档案库带来一页纸，上面留着雨痕与破损的封印。"),
          text("This report says the port is growing restless. Yet the official record claims all is calm.", "这份报告说港口人心不安，可官方记录却声称一切平静。"),
          text("Bad news is not betrayal. Hiding it from the people and the court may be.", "坏消息并不等于背叛。对百姓和朝廷隐瞒，或许才是背叛。"),
          text("Officials wanted the messenger's name hidden. Traders demanded an answer before the next ship sailed.", "官员要求隐去报信者的姓名。商人们则要求在下一艘船启航前得到答复。"),
          text("Choose: protect the person who brought the news, or verify every line of the report.", "你必须选择：保护带来消息的人，还是核实报告中的每一行字。"),
          text("One name appears in every copy: Sunda Kalapa. If we wait for certainty, the port may already have chosen its own path.", "每份抄本上都反复出现一个名字：巽他卡拉帕。若等到一切确定，港口或许早已自行选择了道路。"),
          text("Sails filled the distant estuary. Pakuan must decide how to speak to a world arriving by sea.", "远方的河口挤满了船帆。巴库安必须决定，如何回应从海上而来的世界。"),
        ],
        choices: [
          { label: text("Protect the messenger", "保护报信者"), consequence: text("People will see the court stand with those brave enough to speak, though the evidence must still be tested.", "百姓会看到宫廷支持敢于发声的人，但证据仍须核实。") },
          { label: text("Verify every copy first", "先核实每份抄本"), consequence: text("The decision will rest on evidence, but traders will wait longer for an answer.", "决定将以证据为依据，但商人们要等更久才能得到答复。") },
        ],
      },
      "pajajaran-sunda-portuguese-treaty": {
        title: text("A Padrão at the Ciliwung Estuary", "芝利翁河口的石柱"),
        intro: text("In 1522, Portuguese representatives and the Sunda Kingdom agreed on trade ties and a fort at Sunda Kalapa. The diplomacy brought opportunity—and a new threat to the harbor.", "1522年，葡萄牙代表与巽他王国达成贸易与在巽他卡拉帕修筑堡垒的协议。这场外交带来机会，也为港口带来新的威胁。"),
        opponentTitle: text("The Estuary Guard Commander", "河口守军将领"),
        objective: text("Defend Sunda's room for diplomacy as pressure mounts at the harbor.", "在港口压力加剧时，守住巽他进行外交斡旋的空间。"),
        ending: text("The padrão marked a treaty that never became the planned fort. Five years later, Sunda Kalapa changed hands.", "这根石柱标记着一份未能建成预定堡垒的盟约。五年后，巽他卡拉帕易手。"),
        scenes: [
          text("Foreign ships lowered their sails in the estuary. A stone marker awaited its place by the river: friendship to one side, a changing balance to the other.", "外国船只在河口降下风帆。一块石碑等待着被立在河边：一方视它为友谊，另一方却看见局势正在改变。"),
          text("We seek allies to guard the harbor. But we must not hand those allies the right to decide its fate.", "我们需要盟友守护港口，但不能把决定港口命运的权力交给盟友。"),
          text("We bring a treaty and commercial interests. They travel together, even when the words on paper sound gentler.", "我们带来了盟约与贸易利益。即使纸上的措辞更加温和，两者也始终同行。"),
          text("Merchants asked whether the fort would protect their ships or change who controlled the estuary. Sailors watched from the decks.", "商人们追问，堡垒究竟会保护船只，还是改变河口的掌控者。船员们在甲板上注视着一切。"),
          text("A treaty is no end to vigilance. Give every promise a boundary, and make sure each side knows what is at stake.", "盟约并不是警惕的终点。每项承诺都要有边界，也要让各方明白自己押上了什么。"),
          text("The marker faced the current. Upstream, envoys carried the news to Pakuan; downstream, ships bore it to neighboring kingdoms.", "石碑面向水流。上游的使者把消息带往巴库安，下游的船只则将它传向邻近王国。"),
          text("If this estuary falls, Pakuan loses more than trade. It loses its path to hear the world.", "若河口失守，巴库安失去的将不只是贸易，还有倾听世界的通道。"),
        ],
        choices: [
          { label: text("Set stricter limits on the treaty", "收紧盟约的界限"), consequence: text("Sunda's control of the harbor will be affirmed, but its trading allies will demand new guarantees.", "巽他对港口的掌控将得到确认，但贸易盟友会要求新的保障。") },
          { label: text("Accept joint protection", "接受共同防卫"), consequence: text("Ships will be protected, but more parties will feel entitled to decide the estuary's fate.", "船只将得到保护，但会有更多势力认为自己有权决定河口的命运。") },
        ],
      },
      "pajajaran-border-accord": {
        title: text("When Kalapa Changed Its Name", "卡拉帕更名之时"),
        intro: text("In 1527, Sunda Kalapa fell to forces led by Fatahillah, according to the commonly cited tradition. As the harbor changed hands, ordinary people searched for a road still open to them.", "按照常见的历史记载，1527年巽他卡拉帕落入法塔希拉率领的军队之手。港口易主之际，普通百姓仍在寻找一条可以回家的路。"),
        opponentTitle: text("Faletehan", "法莱特汉"),
        objective: text("Face the struggle for Kalapa and decide what must be saved first.", "面对卡拉帕争夺战，决定什么必须优先获救。"),
        ending: text("Sunda Kalapa changed hands. News of the lost city traveled inland to Pakuan, where Surawisesa would later honor his father in stone.", "巽他卡拉帕易手了。失城的消息传向内陆巴库安，苏拉维塞萨后来在那里以石碑纪念父亲。"),
        scenes: [
          text("Smoke rose from the estuary. A guard at the roadside carried two messages: hold the troops, or move the people away from the river.", "河口方向升起浓烟。路边的守卫带来两道命令：坚守阵地，或让百姓撤离河岸。"),
          text("Do not make us choose between the harbor and its people. Find a road that saves as many as possible.", "别让我们只能在港口与百姓之间二选一。找出一条能救下尽可能多人的路。"),
          text("The ships have gone. Some families still search for their children, and the harbor records remain in the harbor master's house.", "船只已经离港。有些家庭还在寻找孩子，港口档案则仍留在港务官的家中。"),
          text("The opposing army is entering the city. There is time for one act: open an evacuation route, secure the records, or gather the guards.", "敌军正进入城中。只来得及做一件事：打开撤离通道、抢救档案，或集结守军。"),
          text("The city may be taken. Do not let those who remain become victims left unnamed in a war report.", "城池或许会失守。不要让留下的人沦为战报中无名的牺牲者。"),
          text("The banner at the gate changed. Behind the ranks, a child carried a wet river map, unsure whether the road home still led to the same city.", "城门上的旗帜换了颜色。队伍后方，一个孩子带着被雨水浸湿的河道地图，不知道回家的路是否还通往同一座城。"),
          text("We can no longer guard Kalapa as we did yesterday. But its people still have a future if we get them out.", "我们再也无法像昨日那样守住卡拉帕。但只要能带百姓离开，他们仍有未来。"),
        ],
        choices: [
          { label: text("Open a route for the people", "为百姓打开撤离通道"), consequence: text("More families will escape, while the harbor records may be left behind.", "更多家庭能够脱身，但港口档案可能会被遗弃。") },
          { label: text("Save the maps and records", "抢救地图与档案"), consequence: text("Routes and place-names will endure, but some people must find their own way out.", "道路与地名得以保存，但有些百姓只能自行寻找出路。") },
        ],
      },
      "pajajaran-batutulis-memory": {
        title: text("The Stone That Remembers", "铭记往事的石碑"),
        intro: text("Batutulis is commonly dated to around 1533 and linked to Surawisesa's remembrance of Sri Baduga Maharaja, though the date reading is debated. Amid political change, the stone asks who deserves remembrance—and how a realm passes on its past.", "常见说法将巴图图利斯碑定于约1533年，并认为它是苏拉维塞萨为纪念斯里·巴杜加·马哈拉贾所立，但碑文年代仍有争议。政局变迁之中，石碑追问：谁值得被记住？一个王国又该如何传承过去？"),
        opponentTitle: text("The Commander Opposing the Inscription", "反对立碑的将领"),
        objective: text("Protect the inscription and decide how Pakuan should remember its king.", "保护石碑，并决定巴库安应如何铭记自己的君王。"),
        ending: text("Batutulis became an important marker of Pakuan's memory. Yet no inscription could stop change from moving inland from the coast.", "巴图图利斯碑成为巴库安记忆的重要标志，但没有任何铭文能阻止变局从海岸继续深入内陆。"),
        scenes: [
          text("A chisel touched stone south of Pakuan. Each strike sounded like an answer to the years since the harbor changed hands.", "凿子敲击着巴库安南方的石头。每一次敲击，都像是在回应港口易手后的岁月。"),
          text("My father built a realm people remember. I want this stone to name him without turning his life into a story beyond question.", "父亲建立了一个百姓仍记得的王国。我希望石碑刻下他的名字，却不把他的一生变成不容质疑的传说。"),
          text("Stone can outlast a voice. But who decides which words deserve to be carved?", "石头比声音长久。但谁来决定哪些话值得刻在石上？"),
          text("Court officials wanted the inscription to speak of glory. Refugees from Kalapa asked that their loss not be made small.", "宫廷官员希望铭文歌颂辉煌。来自卡拉帕的流亡者则希望自己的失去不被轻描淡写。"),
          text("A memory made only of praise will be fragile. One that makes room for pain may teach the next ruler.", "只由赞美组成的记忆十分脆弱。愿意容纳伤痛的记忆，或许能教会下一任统治者。"),
          text("Beneath a tree, a child read Sri Baduga's name slowly. The child did not know every event, but understood that the adults were trying to preserve something.", "树下，一个孩子慢慢念着斯里·巴杜加的名字。孩子尚不了解全部往事，却明白大人们正在努力保存某种东西。"),
          text("Carve his name. Then let the next generation ask what they should do with the inheritance.", "刻下他的名字，然后让后世追问：他们该如何面对这份遗产？"),
        ],
        choices: [
          { label: text("Honor Sri Baduga's achievements", "铭记斯里·巴杜加的功绩"), consequence: text("The inscription will strengthen pride, while the pain of losing the harbor still waits to be acknowledged.", "石碑会增强百姓的自豪感，但失去港口的伤痛仍有待承认。") },
          { label: text("Record legacy alongside responsibility", "同时铭记遗产与责任"), consequence: text("The words will remind readers that glory brings a duty to protect the people.", "铭文将提醒后人：荣耀也意味着保护百姓的责任。") },
        ],
      },
      "pajajaran-fractured-court": {
        title: text("Banners at the Crossroads", "十字路口的旗帜"),
        intro: text("Decades passed. Outside pressure and internal disputes left Sundanese lands facing a future no longer shaped by one center alone. This chapter uses fictional figures and conflict to portray that long change.", "数十年过去，外部压力与内部纷争使巽他各地面对一个不再由单一中心决定的未来。本章以虚构人物和冲突呈现这段漫长变迁。"),
        opponentTitle: text("The Border Banner Commander", "边境旗军将领"),
        objective: text("Keep Pakuan connected to its regions as pressure continues to rise.", "在压力不断升高之际，维系巴库安与各地的联系。"),
        ending: text("One road after another changed. The latest report said Banten's army was moving toward Pakuan; the city had to decide what mattered most to carry forward.", "道路一条接一条地改变。最新消息称万丹军正向巴库安进发；这座城必须决定，什么才是最值得带往未来的东西。"),
        scenes: [
          text("Lines had been redrawn across Pakuan's map. Envoys arrived with different needs: some asked for troops, others for room to govern themselves.", "巴库安地图上的边界被反复重画。使者们带着各自的需求而来：有人请求军队，有人要求自治空间。"),
          text("I have walked through many lands. Roads still connect people even when rulers can no longer agree on borders.", "我曾走过许多地方。即使统治者不再认同彼此的边界，道路仍能连接人们。"),
          text("A kingdom is not one voice. If the center only commands, distant regions will learn to live without listening.", "王国并非只有一种声音。若中心只会下令，远方的地方终将学会不再倾听。"),
          text("An envoy waited at the gate with two letters: one a threat, the other an offer that could change his region's loyalty.", "一名使者在城门等待，手中有两封信：一封是威胁，另一封是可能改变其领地立场的合作提议。"),
          text("Listen to what they ask, not only who sent them. A letter's contents can be more honest than its seal.", "听清他们的诉求，不要只看是谁派来的。有时信上的内容比印章更诚实。"),
          text("Mist covered the road to the city. The guards raised their banners, but not every banner faced the same way.", "迷雾遮住了通往城池的道路。守卫举起旗帜，但并非所有旗帜都朝向同一个方向。"),
          text("Send an answer the envoy can carry home. We must endure without making every neighbor feel they have lost their choice.", "给使者一份能够带回家的答复。我们必须坚持下去，同时不能让每个邻邦都觉得自己失去了选择。"),
        ],
        choices: [
          { label: text("Offer an equal alliance", "提出平等结盟"), consequence: text("Some regions will remain allies, but Pakuan must share authority and hear their objections.", "部分地区会继续结盟，但巴库安必须分享权力并倾听他们的异议。") },
          { label: text("Gather strength at the center", "将力量集中于王都"), consequence: text("Pakuan's defenses will grow, but distant regions may doubt that the center understands them.", "巴库安的防御会增强，但远方各地可能会怀疑中心是否理解他们。") },
        ],
      },
      "pajajaran-pakuan-finale": {
        title: text("Pakuan's Last Dawn", "巴库安的最后黎明"),
        intro: text("In 1579, Banten's forces attacked Pakuan, ending the Sunda Kingdom as a centralized political power. The final battle places you in the city's last day, when saving people and heritage matters as much as holding the walls.", "1579年，万丹军进攻巴库安，巽他王国作为中央集权政权走向终结。最终战发生在城池最后一天，拯救百姓与守护遗产和守住城墙同样重要。"),
        opponentTitle: text("Maulana Yusuf", "毛拉纳·优素福"),
        objective: text("Face the final assault and choose which legacy of Pakuan will survive the dawn.", "迎战最后的进攻，决定巴库安的哪份遗产能够留到黎明之后。"),
        endingTitle: text("Pakuan Falls, Its Traces Shine On", "巴库安陷落，遗迹仍闪耀"),
        ending: text("Pakuan's gates fell silent. The Sunda Kingdom no longer stood as one center of power, yet its roads, language, memory, and people endured. In the mist, a child reopened Bujangga Manik's notes and found a way home.", "巴库安的城门归于沉寂。巽他王国不再是统一的权力中心，但它的道路、语言、记忆与人民仍然延续。迷雾中，一个孩子重新翻开布扬加·马尼克的记录，找到了回家的路。"),
        scenes: [
          text("A sound at the gate broke the morning mist. Families gathered at a Pakuan crossroads: one road led to the forest, one to the hall, and one to the palm-leaf archive.", "城门传来的声响划破晨雾。巴库安的十字路口聚集着许多家庭：一条路通往森林，一条通往宫廷，还有一条通往棕榈叶文库。"),
          text("Let no one believe that losing the throne means losing all the Sundanese people.", "不要让任何人以为，失去王位就意味着巽他人民也将消失。"),
          text("A place-name lives as long as someone can speak it. Carry the manuscripts, but make sure their readers survive too.", "只要有人还能说出一个地名，它就仍然活着。带上典籍，也要确保未来的读者能够活下来。"),
          text("The enemy commander broke through the outer gate. The guards asked for a final order: defend the palace, open an escape route, or save the records of Sundanese roads.", "敌军将领突破了外城门。守卫等待最后的命令：坚守宫殿、打开撤离通道，还是抢救记录巽他道路的典籍。"),
          text("I will face the army here. You decide what must still live after sunset.", "我会在这里迎战军队。你来决定，日落之后什么必须继续存在。"),
          text("The walls shook with battle. Far away, refugees moved toward regions that would carry Sundanese customs and governance into new forms.", "战火震动城墙。远方的流亡者正前往各地，在那里，巽他习俗与治理方式将以新的形态延续。"),
          text("A kingdom can lose its capital. A people's story is lost only when no one dares to carry it home.", "王国可以失去首都。只有再也无人敢把它的故事带回家，一个民族的故事才会真正消失。"),
        ],
        choices: [],
      },
    },
  },
};

export function localizeStorySpeaker(speaker: string): Localized | undefined {
  const labels: Record<string, Localized> = {
    Narator: text("Narrator", "旁白"),
    "Utusan Madura": text("Madura Envoy", "马都拉使者"),
    "Utusan Sunda": text("Sundanese Envoy", "巽他使者"),
    "Penyalin Muda": text("Young Copyist", "年轻抄写员"),
    "Penjaga Kabuyutan": text("Sanctuary Keeper", "圣地守卫"),
    "Juru Tulis Pakuan": text("Pakuan Scribe", "巴库安书记"),
    "Utusan Portugis": text("Portuguese Envoy", "葡萄牙使者"),
    "Pengawal Kalapa": text("Kalapa Guard", "卡拉帕守卫"),
    "Juru Pahat": text("Stone Carver", "石匠"),
  };
  return labels[speaker];
}

export function localizeStoryLocation(location: string): Localized | undefined {
  const labels: Record<string, Localized> = {
    "Jalur Sungai Brantas": text("Brantas River Route", "布兰塔斯河道"),
    "Dermaga Madura": text("Madura Pier", "马都拉码头"),
    "Perkemahan Tarik": text("Tarik Camp", "塔里克营地"),
    "Hutan Tarik": text("Tarik Forest", "塔里克森林"),
    "Pelabuhan Tuban": text("Tuban Harbor", "图班港"),
    "Balairung Majapahit": text("Majapahit Royal Hall", "满者伯夷王廷"),
    "Jalan Tuban": text("Tuban Road", "图班道路"),
    "Jalur Hutan Timur": text("Eastern Forest Route", "东部森林之路"),
    "Gerbang Sadeng": text("Sadeng Gate", "萨登关门"),
    "Gerbang Keta": text("Keta Gate", "克塔关门"),
    "Balairung Agung": text("Great Hall", "大殿"),
    "Serambi Istana": text("Palace Veranda", "宫廷回廊"),
    "Pasar Trowulan": text("Trowulan Market", "特罗乌兰集市"),
    "Lapangan Bubat": text("Bubat Field", "布巴特平原"),
    "Puri Trowulan": text("Trowulan Palace", "特罗乌兰宫殿"),
    "Jalur Menuju Bubat": text("Road to Bubat", "通往布巴特的道路"),
    "Gerbang Bubat": text("Bubat Gate", "布巴特城门"),
    "Pertapaan Kamalasana": text("Kamalasana Hermitage", "卡马拉萨纳修行所"),
    "Cakrawala Nusantara": text("Nusantara Horizon", "努山塔拉天际"),
    "Gerbang Penyatuan": text("Gate of Unity", "团结之门"),
    "Balairung Trowulan": text("Trowulan Royal Hall", "特罗乌兰王廷"),
    "Laut Nusantara": text("Nusantara Sea", "努山塔拉海域"),
    "Gerbang Pakuan": text("Pakuan Gate", "巴库安城门"),
    "Jalan Pakuan": text("Pakuan Road", "巴库安道路"),
    "Jalur Pegunungan": text("Mountain Route", "山间道路"),
    "Kabuyutan Sunda": text("Sundanese Sanctuary", "巽他圣地"),
    "Jalur Pesisir": text("Coastal Route", "海岸道路"),
    "Ruang Arsip Pakuan": text("Pakuan Archive Room", "巴库安档案室"),
    "Balairung Pakuan": text("Pakuan Royal Hall", "巴库安王廷"),
    "Pasar Pakuan": text("Pakuan Market", "巴库安集市"),
    "Jalan Menuju Kalapa": text("Road to Kalapa", "通往卡拉帕的道路"),
    "Muara Sunda Kalapa": text("Sunda Kalapa Estuary", "巽他卡拉帕河口"),
    "Balairung Sunda Kalapa": text("Sunda Kalapa Royal Hall", "巽他卡拉帕王廷"),
    "Dermaga Sunda Kalapa": text("Sunda Kalapa Pier", "巽他卡拉帕码头"),
    "Muara Ciliwung": text("Ciliwung Estuary", "芝利翁河口"),
    "Jalan Kalapa": text("Kalapa Road", "卡拉帕道路"),
    "Pos Perbatasan": text("Border Post", "边境哨所"),
    "Gerbang Kalapa": text("Kalapa Gate", "卡拉帕城门"),
    "Jalan Pesisir": text("Coastal Road", "海岸道路"),
    Batutulis: text("Batutulis Monument", "巴图图利斯碑"),
    "Pelataran Pakuan": text("Pakuan Courtyard", "巴库安庭院"),
    "Ruang Naskah Pakuan": text("Pakuan Manuscript Room", "巴库安典籍室"),
  };
  return labels[location];
}
