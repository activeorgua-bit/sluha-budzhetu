// The inner voice: book-style narration shown in a parchment panel at the bottom of the screen.
//
// An entry is a string, an array (one is picked at random) or an object with state buckets:
//   { clean, corrupt, wanted, drunk, any }   (checked in order: drunk -> wanted -> corrupt/clean -> any)
// clean   = nothing taken yet (GameState.cleanRun)
// corrupt = something taken, heat below "wanted"
// wanted  = heat tier 3+ (NABU is hunting)
// drunk   = currently drunk (checked first when present)
// Placeholders: {wallet} {heat} {conscience}
//
// Level zones reference these keys from the level files (meta.narration); events from Narrator.js.
export const NARRATION = {
  uk: {
    // ------------------------------------------------------------------ level starts
    start_l11: 'Звичайний день депутата, слуги народу. Сьогодні я прокинувся в хорошому настрої та вирішив піти на роботу пішки. Здавалося б, що може піти не так.',
    start_l12: {
      clean: 'Міст через Дніпро будують уже дев’ятий рік. Кошторис — як на космодром. А я просто йду по ньому. Пішки. Чесно.',
      corrupt: 'Цей міст я знаю краще, ніж будь-хто: половину арматури з нього я бачив у себе на дачі. Будемо йти обережно.',
      wanted: 'Міст тримається на чесному слові. Моєму. Тобто ні на чому.',
    },
    start_p21: {
      clean: 'Маріїнський парк. Каштани, бабусі, діти й фонтан. Звідси до Ради — рукою подати. Головне — нікому не подати руки з конвертом.',
      corrupt: 'Маріїнський парк. Тут кожна бабця знає мене в обличчя. Бо бачила по телевізору. У новинах. У розділі «кримінал».',
      wanted: 'У парку тихо. Занадто тихо. Навіть голуби дивляться на мене, як детективи НАБУ.',
    },
    start_p21b: 'Сховище під Радою. Сталін будував на випадок ядерної війни, а пригодилося на випадок депутатів. Пахне пилом, пліснявою і п’ятирічкою.',
    start_p22: {
      clean: 'Коридори Ради. Мармур, килими, люстри. Помічники бігають з папками — хтось же має читати ці закони.',
      corrupt: 'Коридори Ради. Тут кожні двері — чийсь кабінет, а кожен кабінет — чийсь бізнес. Відчуваю себе як удома.',
      wanted: 'Коридор кишить журналістами. Я б сховався в кабінеті, але всі кабінети вже зайняли такі, як я.',
    },
    start_p23: {
      clean: 'Сесійна зала. Спікер сьогодні не в гуморі. Сподіваюся, регламент на моєму боці. Хоча регламент ніколи ні на чиєму боці.',
      corrupt: 'Сесійна зала. Тут приймають закони. Іноді навіть ті, за які заплатили.',
      wanted: 'Зала повна. Всі дивляться на мене. Так дивляться на людину, яку от-от позбавлять недоторканності.',
    },
    start_l31: {
      clean: 'Вечірка. Шампанське рікою, олігархи штабелями. Я тут чужий. І, чесно кажучи, мені це подобається.',
      corrupt: 'Вечірка в олігарха. Тут усі свої: кожен кому-небудь щось винен.',
      wanted: 'Вечірка. Якщо сюди зайде НАБУ, половина гостей стрибне у басейн. Друга половина — у вікно.',
    },
    start_l32: {
      clean: 'Аеропорт. Відпустка. Чиста совість — найкращий паспорт.',
      corrupt: 'Аеропорт. Паспорт є. Квиток є. Совість… поклав у валізу, щоб не заважала.',
      wanted: 'Аеропорт. Кожен прикордонник дивиться на мене так, ніби вже бачив моє фото. На стенді «Розшук».',
    },

    // ------------------------------------------------------------------ level 1-1 zones
    l11_office_bag: 'О. Знайомий офіс. Я їм допоміг з будівництвом прекрасного готелю на 2000 місць у заповідних лісах — послуга за послугу. Як приємно, коли корисна робота ще й добре оплачується.',
    l11_cop: {
      clean: 'Патрульний. Добре, що поліція на місці. Хоча чого це мені, чесній людині, радіти поліції?',
      any: 'Чортів мусор. І де ті копи, коли вони потрібні.',
    },
    l11_kiosk: {
      clean: 'Кіоск. Кава, сигарети, щось міцніше. Мені нічого не треба — я сьогодні легкий, як бюджетний дефіцит.',
      any: 'Кіоск. «Щось для настрою» — 3 хабарі. Натисни E, якщо совість знову почне бубоніти.',
    },
    l11_trench: 'Дорожні роботи. Цю яму я відкрив особисто, з червоною стрічкою. Закрити її, щоправда, забули профінансувати.',
    l11_billboard: {
      clean: 'Мій білборд. «Реформа — це назавжди». Художник трохи підправив мені ніс. Добре, що хоч ніс.',
      any: 'Мій білборд. Оплачений з фонду «підтримки громадських ініціатив». Громада ініціативно підтримала мій рейтинг.',
    },
    l11_park: 'Парк університету Шевченка. Тут я колись складав іспит з економіки. Здав з третьої спроби. Потім теорію довелося засвоювати на практиці.',
    l11_monument: {
      clean: 'Тарас Григорович дивиться суворо. «Борітеся — поборете». Поки що я борюся лише з бажанням взяти той мішок.',
      any: 'Тарас Григорович дивиться на мене з постаменту. Здається, він знає, що в моїх кишенях. Кобзар бачив і не таке.',
    },
    l11_tree: 'Каштан. Символ Києва і найчесніша зброя в місті: безкоштовна, росте сама і не вимагає тендеру.',

    // ------------------------------------------------------------------ level 1-2 zones
    l12_hook: 'Кран. Гак. Бетонний блок. Все як у моїй політичній кар’єрі: висить над головою і може впасти будь-якої миті.',
    l12_scaffold: 'Риштування на тросах. Хто монтував? Фірма мого кума. Хто перевіряв? Мій кум. Чого боятися?',
    l12_cabin: 'Будівельна бита. Тут підписали акт виконаних робіт. Роботи ще не виконані, але акт — чудовий.',
    l12_camera: {
      clean: 'Камера телеканалу. Нехай знімають — мені нема чого приховувати. Вперше за сім скликань.',
      any: 'Камера. Посміхаюся, як у бюлетені. Руки — в кишенях. Кишені — повні.',
    },
    l12_fisherman: 'Рибалка на пірсі. Єдина людина в Києві, яку не цікавить, скільки я вкрав. Його цікавить, чи клює.',

    // ------------------------------------------------------------------ world 2 zones
    p21_tree: 'Каштани. Трусни — і маєш набої. Шкода, що бюджет так не працює. Хоча… у мене саме так і працював.',
    p21_fountain: 'Фонтан. Кинути монетку, щоб повернутися? Та ні, монетки мені ще знадобляться.',
    p21_hatch: 'Люк у кущах. Між туями. З червоною зіркою. Хтось дуже старався, щоб його ніхто не знайшов.',
    p21_boss: {
      clean: 'Біля входу — аніматор у костюмі Патрона. Фото — шість хабарів. У мене нема жодного. Доведеться по-чесному. Каштанами.',
      any: 'Біля входу — аніматор у костюмі Патрона. Фото — шість хабарів. Або шість каштанів у морду. Економіка вибору.',
    },
    p21b_lenin: 'Бюст Ільїча. Дивиться з докором. Він теж обіцяв людям світле майбутнє. Теж не склалося.',
    p21b_phones: 'Три телефони. Червоний — Кремль, чорний — ЦК, бежевий — кум. Судячи з пилу, дзвонив лише бежевий.',
    p21b_vodka: 'Пляшка горілки, 1953 рік. Витримка, як у моїх виборчих обіцянок.',
    p21b_boss: 'Щур-балалаєчник. Грає «Калинку» і вимагає золото партії. Нарешті хтось чесно називає речі своїми іменами.',
    p22_office: 'Порожній кабінет. У шафі — віскі, у шухляді — віскі, під столом — теж віскі. Мабуть, тут працює комітет з питань охорони здоров’я.',
    p22_press: 'Прес-стіна. Тут дають коментарі. Головне правило: говорити довго, щоб ніхто не встиг запитати.',
    p22_oppmp: 'Опозиція. Кидається шоколадками. Моя ж шоколадка, між іншим, — я за неї голосував у бюджеті.',
    p23_boss: 'Спікер. Молоток у руці, регламент у голові, у кишенях — усе інше.',

    // ------------------------------------------------------------------ events: pickups
    first_coin: {
      clean: 'Монетка. Маленька, блискуча, нічия. «Нічия» — це так ми в Раді називаємо бюджетні кошти.',
      any: 'Ще монетка. Одна — випадковість. Дві — тенденція. Три — вже схема.',
    },
    coin: [
      'Дзень. Приємний звук. Звук оптимізації видатків.',
      'Ще одна. Я не беру — я акумулюю.',
      'Ну хто ж кидає гроші просто на вулиці? Безгосподарність.',
      'Це не хабар. Це подяка. Маленька. Поки що.',
      'Кишені важчають. Ноги теж.',
    ],
    first_bag: 'Мішок з грошима. Без розписки, без печатки. Як у старі добрі часи.',
    bag: [
      'Ще мішок. Я майже відчуваю, як десь заплакала одна лікарня.',
      'Мішок. Скромний, без понтів. Як мій офіційний дохід.',
      'Важкий. Наче чиясь пенсія за десять років.',
    ],
    trap: {
      any: 'Мічена купюра. Звісно. Вони завжди мітять найкрасивіші.',
      wanted: 'Мічена купюра. НАБУ вже навіть не ховається. Мабуть, я їх розбалував.',
    },
    question_block: 'Коробка з сюрпризом. Як тендер: ніколи не знаєш, що всередині, але завжди знаєш, хто виграє.',

    // ------------------------------------------------------------------ events: bribes & enemies
    bribe_ok: [
      'Домовились. Люблю людей, які розуміють з пів купюри.',
      'Узяв. Усі беруть. Головне — вчасно дати.',
      'Конструктивний діалог. Я говорив грошима, він — мовчанням.',
    ],
    bribe_cop: 'Патрульний узяв. Навіть не торгувався. Реформа поліції, кажете?',
    bribe_fail: [
      'Не взяв. Принциповий. Такі довго не живуть. На посаді.',
      'Відмовився. Ще й образився. Мабуть, мало дав.',
      'Не бере. Світ котиться до біса — чесні люди на кожному кроці.',
    ],
    flash: {
      clean: 'Спалах камери. Фото вийде гарне: я нічого не несу. Хай друкують.',
      any: 'Спалах! Завтра на першій шпальті: «Депутат на прогулянці. З мішком».',
    },
    hurt_oldlady: [
      'Бабця ціпком по спині. Виборча кампанія наживо.',
      'Ой. Ціпок у бабусі важчий за мій мандат.',
    ],
    hit_chestnut: 'Каштаном у лоб. Так мене ще не критикували.',
    stun_civilian: [
      'Я оглушив бабцю каштаном. Десь у глибині душі мені соромно. Дуже глибоко.',
      'Дитина лежить із зірочками над головою. Совість тихенько записує це в блокнот.',
    ],
    stun_journalist: 'Журналіст отримав каштаном. Свобода слова трохи поморщилась.',

    // ------------------------------------------------------------------ events: conscience & alcohol
    conscience_warn: {
      any: 'Щось муляє в грудях. Не серце — там давно порожньо. Совість. Прокидається.',
      drunk: 'Совість крізь туман бурмоче щось про «повернути все людям». Цить.',
    },
    conscience_freeze: [
      'Совість заговорила. Ноги не йдуть. Перед очима — всі лікарні, яких не збудували.',
      'Раптом згадав маму. «Синку, тільки не йди в політику». Не послухав.',
      'Мене паралізувало каяття. Кажуть, у депутатів такого не буває. Брешуть.',
      'Совість вимагає зізнання. Я вимагаю адвоката. Поки що нічия.',
    ],
    conscience_quiet: 'Тиша. Совість уклалася спати. Хай поспить — завтра в неї багато роботи.',
    shop_buy: {
      any: 'Віскі. Ціна — три хабарі. Продавчиня навіть не підняла очей. Професіоналка.',
    },
    shop_no_money: {
      clean: 'Грошей нема. Жодної гривні. Вперше в житті це звучить як комплімент.',
      any: 'Грошей нема. Все роздав. Щедра душа.',
    },
    drink_whiskey: [
      'Ковток віскі. Совість м’якне, ноги теж.',
      'Шотландський. Дванадцять років витримки. Як моє слідство.',
      'Віскі з оленем на етикетці. Олень — це я. Благородний і трохи загнаний.',
    ],
    drink_vodka: [
      'Радянська горілка. Шістдесят років у підвалі. Совість не просто затихла — вона емігрувала.',
      'Горілка з підвалу Ради. Смак — як у п’ятирічки: гірко, але обіцяли, що буде краще.',
    ],
    drunk_walk: [
      'Земля хитається. Або це рейтинг.',
      'Я цілком тверезий. Просто світ іде зигзагом.',
      'Гик. Вибачте. Це був не я, це був бюджетний дефіцит.',
    ],
    hangover: 'Хміль вивітрився. Залишились головний біль і совість. Удвох їм у голові тісно.',

    // ------------------------------------------------------------------ events: heat tiers
    tier_1: 'Помітили. Перші запитання в соцмережах. Нічого, погомонять і забудуть.',
    tier_2: 'Мною цікавляться журналісти-розслідувачі. Час подумати про другий паспорт.',
    tier_3: 'НАБУ відкрило провадження. Я відкрив пляшку. Кожен займається своєю справою.',
    tier_4: 'Мене шукають усі. Навіть ті, кому я винен. Особливо ті, кому я винен.',

    // ------------------------------------------------------------------ events: progress
    checkpoint: {
      clean: 'Контрольна точка. Руки чисті, кишені порожні. Незвичне відчуття — наче вперше вдягнув свіжу сорочку.',
      corrupt: 'Контрольна точка. Перерахував. Не вистачає. Завжди не вистачає.',
      wanted: 'Контрольна точка. Треба відсапатися. І прикинути, в якій країні немає договору про екстрадицію.',
    },
    secret_found: 'Таємний хід. У кожного поважного депутата має бути таємний хід. У мене їх уже два.',
    boss_beaten: 'Переможений. Без жодного хабаря. Сам собі не вірю.',
    boss_bribed: 'Домовились. Він задоволений, я задоволений. Незадоволений лише бюджет, але хто його питав.',
    time_low: 'Час спливає. Як мій рейтинг перед виборами.',
    // ------------------------------------------------------------------ world 3
    start_e31: {
      clean: 'Вечірка у Печерському палаці. Мене запросили як «перспективного». Я тут чужий, і бандити це відчувають.',
      corrupt: 'Вечірка для своїх. Бандити кивають мені, як старому знайомому. Приємно. І страшно.',
      wanted: 'Тут кожен другий — у розшуку. Вперше в житті я не виділяюся з натовпу.',
    },
    e31_pool: 'Басейн з рожевою підсвіткою. Кажуть, у ньому топили і бюджети, і конкурентів.',
    e31_dj: 'Діджей грає «Червону руту» в стилі техно. Патріотизм на експорт.',
    e31_safe: 'Сейф. Відчинений. Порожній. Хтось уже встиг.',
    mafia_offer: 'Ось він. Бос. Валіза в руці, сигара в зубах. Уся моя кар’єра вела сюди.',
    mafia_yes: 'Я сказав «так». Валіза важка, шампанське легке. Що може піти не так?',
    mafia_no: 'Я сказав «ні». У залі стало дуже тихо. Навіть діджей вимкнув музику.',
    start_e32: {
      clean: 'Спальний район. Сонце сідає за панельками, пахне шаурмою і липами. Люди тут не знають мене в обличчя. І це прекрасно.',
      corrupt: 'Троєщина. Мене впізнають. Бабці — з балконів, гопники — з лавок, громадяни — з яйцями. Здається, мої білборди тут бачили.',
      wanted: 'Без піджака, без грошей, у розшуку. Кожен балкон дивиться на мене, як приціл.',
    },
    e32_debris: 'Балкони тут тримаються на чесному слові. І на арматурі, яку, здається, теж хтось поцупив.',
    e32_court: 'Спортмайданчик. Гопники присіли навпочіпки — значить, нарада. На порядку денному — я.',
    e32_dogs: 'Собачий майданчик. Громадяни з собаками. Собаки, на відміну від виборців, пам’ятають усе.',
    e32_bridge: {
      clean: 'Міст-хвиля. Кажуть, найкрасивіший у Києві. Іду спокійно — мені нічого боятися.',
      any: 'Міст-хвиля. Тендер на нього виграла фірма мого кума. Пам’ятаю, скільки там було бетону. Точніше, скільки не було.',
    },
    e32_river: 'Набережна. Захід сонця над затокою. Якби не гопники й не детективи — ідеальне побачення.',
    e32_street: 'Вулиця з тролейбусними дротами. До таксі — рукою подати. Головне — щоб на таксі вистачило.',
    e32_boss: 'Троє в спортивках. «Слиш, дядя…» — у Києві так починаються найважливіші переговори.',
    taxi_paid: 'П’ять хабарів на таксі. Найчесніше витрачені гроші за всю мою каденцію.',
    life_letter: 'Лист від виборців. Від руки, з помилками і щиро: «Дякуємо, що не крадете». Аж дихати легше.',
    life_score: 'Кажуть, люди помічають, коли працюєш, а не «вирішуєш питання». Приємно.',
    taxi_salary: 'На таксі вистачило депутатської зарплати. Дивно: жити на зарплату — можна.',
    taxi_free: 'Таксист упізнав мене: «Ви ж той, що не бере? Сідайте, безкоштовно». Вперше чесність окупилась готівкою.',
    taxi_no_money: 'Таксі є, грошей нема. Як у бюджеті: об’єкт є, фінансування нема.',
    start_e33: {
      clean: 'Вокзал. Потяг на захід, квиток у плацкарт, у кишені — зарплата. Звучить як початок хорошої книжки.',
      corrupt: 'Вокзал. Тут більше поліції, ніж пасажирів. Здається, вони теж чекають на мій потяг.',
      wanted: 'Вокзал кишить копами. Моє фото висить поруч із розкладом. На ньому я навіть непогано вийшов.',
    },
    ticket_bought: 'Квиток куплено. Вперше за роки плачу за щось сам.',
    ticket_salary: 'Прийшла депутатська зарплата. Виявляється, на плацкарт цілком вистачає.',
    ticket_no_money: 'Каса. Квиток коштує п’ять. У мене — нічого. Держава в мініатюрі.',
    train_no_ticket: 'Провідниця тримає двері, як детектив НАБУ — справу. Без квитка ні кроку.',
    e33_board: 'Табло: «Київ — Перемишль». Слово «Перемишль» звучить як «перемога». Або як «передумай».',
    e33_boss: 'Потяг. Двері відчинені. Попереду — або Європа, або наслідки.',
    level_clear: {
      clean: 'Ще один чесний день. Якщо так піде далі, мене переоберуть. Або посадять за підозрілу чесність.',
      corrupt: 'Дійшов. Кишені важкі, совість теж. Завтра буде новий день і нові мішки.',
      wanted: 'Дійшов. За мною хвіст з журналістів і детективів. Як за рок-зіркою. Тільки без оплесків.',
    },
  },

  en: {
    start_l11: 'An ordinary day in the life of an MP, a servant of the people. I woke up in a good mood today and decided to walk to work. What could possibly go wrong?',
    start_l12: {
      clean: 'They have been building this bridge over the Dnipro for nine years. The estimate could have built a spaceport. I am simply walking across it. On foot. Honestly.',
      corrupt: 'I know this bridge better than anyone: half of its rebar I have seen at my country house. Let’s walk carefully.',
      wanted: 'The bridge is held together by a promise. Mine. So, by nothing.',
    },
    start_p21: {
      clean: 'Mariinsky Park. Chestnuts, grannies, kids and a fountain. The Rada is a stone’s throw away. The trick is not to throw anything with an envelope.',
      corrupt: 'Mariinsky Park. Every granny here knows my face. From TV. The crime section.',
      wanted: 'The park is quiet. Too quiet. Even the pigeons look at me like NABU detectives.',
    },
    start_p21b: 'The shelter under the Rada. Stalin built it for a nuclear war; it came in handy for MPs. It smells of dust, mould and five-year plans.',
    start_p22: {
      clean: 'The Rada corridors. Marble, carpets, chandeliers. Assistants run around with folders — somebody has to read these laws.',
      corrupt: 'The Rada corridors. Every door is somebody’s office, and every office is somebody’s business. I feel right at home.',
      wanted: 'The corridor is crawling with journalists. I would hide in an office, but they are all taken by people like me.',
    },
    start_p23: {
      clean: 'The session hall. The Speaker is in a bad mood. I hope the rules are on my side. Although the rules are never on anybody’s side.',
      corrupt: 'The session hall. This is where laws are passed. Sometimes even the ones that were paid for.',
      wanted: 'The hall is full. Everyone is looking at me. That is how you look at a man about to lose his immunity.',
    },
    start_l31: {
      clean: 'A party. Rivers of champagne, oligarchs by the dozen. I do not belong here. And honestly, I like that.',
      corrupt: 'An oligarch’s party. Everyone here is family: everyone owes someone something.',
      wanted: 'A party. If NABU walks in, half the guests will jump into the pool. The other half, out of the window.',
    },
    start_l32: {
      clean: 'The airport. A holiday. A clear conscience is the best passport.',
      corrupt: 'The airport. Passport: yes. Ticket: yes. Conscience… packed in the suitcase so it won’t get in the way.',
      wanted: 'The airport. Every border guard looks at me like he has seen my photo already. On the "Wanted" board.',
    },

    l11_office_bag: 'Oh. A familiar office. I helped them build a lovely 2,000-room hotel in a nature reserve — one good turn deserves another. How nice when useful work is also well paid.',
    l11_cop: {
      clean: 'A patrol officer. Good to see the police on duty. Although why would an honest man like me be glad to see the police?',
      any: 'Damn cop. Where are the police when you actually need them?',
    },
    l11_kiosk: {
      clean: 'A kiosk. Coffee, cigarettes, something stronger. I need nothing — today I am as light as the budget deficit.',
      any: 'A kiosk. "Something for the mood" — 3 bribes. Press E if your conscience starts mumbling again.',
    },
    l11_trench: 'Road works. I opened this hole personally, with a red ribbon. Somebody forgot to fund closing it.',
    l11_billboard: {
      clean: 'My billboard. "Reform is forever". The artist touched up my nose. At least only the nose.',
      any: 'My billboard. Paid for by the "civic initiatives support fund". The citizens took the initiative to support my ratings.',
    },
    l11_park: 'The Shevchenko University park. I once took my economics exam here. Passed on the third attempt. Later I had to learn the theory in practice.',
    l11_monument: {
      clean: 'Taras Hryhorovych looks stern. "Fight and you will win". So far I am only fighting the urge to grab that bag.',
      any: 'Taras Hryhorovych looks down at me from his pedestal. He seems to know what is in my pockets. The Kobzar has seen worse.',
    },
    l11_tree: 'A chestnut tree. The symbol of Kyiv and the most honest weapon in town: free, grows by itself and needs no tender.',

    l12_hook: 'A crane. A hook. A concrete block. Just like my political career: hanging over my head, ready to fall at any moment.',
    l12_scaffold: 'Scaffolding on cables. Who installed it? My godfather’s company. Who inspected it? My godfather. What is there to fear?',
    l12_cabin: 'The site cabin. This is where the completion certificate was signed. The work is not completed, but the certificate is excellent.',
    l12_camera: {
      clean: 'A TV camera. Let them film — I have nothing to hide. For the first time in seven convocations.',
      any: 'A camera. Smile like on a ballot. Hands in pockets. Pockets full.',
    },
    l12_fisherman: 'A fisherman on the pier. The only person in Kyiv who does not care how much I stole. He cares whether they are biting.',

    p21_tree: 'Chestnuts. Shake the tree and you have ammo. Pity the budget does not work like that. Although… mine did.',
    p21_fountain: 'A fountain. Throw a coin to come back? No, I will need my coins.',
    p21_hatch: 'A hatch in the bushes. Between the thujas. With a red star. Somebody tried very hard to make sure nobody finds it.',
    p21_boss: {
      clean: 'At the entrance: an animator in a Patron costume. A photo costs six bribes. I have none. It will have to be the honest way. With chestnuts.',
      any: 'At the entrance: an animator in a Patron costume. A photo costs six bribes. Or six chestnuts in the face. The economics of choice.',
    },
    p21b_lenin: 'A bust of Ilyich. He looks at me reproachfully. He also promised people a bright future. It did not work out for him either.',
    p21b_phones: 'Three phones. Red: the Kremlin, black: the Central Committee, beige: my godfather. Judging by the dust, only the beige one ever rang.',
    p21b_vodka: 'A bottle of vodka, vintage 1953. Aged like my election promises.',
    p21b_boss: 'The balalaika rat. Plays "Kalinka" and demands party gold. Finally someone calls things by their names.',
    p22_office: 'An empty office. Whisky in the cupboard, whisky in the drawer, whisky under the desk. Must be the health committee.',
    p22_press: 'The press wall. This is where statements are made. Golden rule: talk for a long time so nobody gets to ask.',
    p22_oppmp: 'The opposition. Throwing chocolate bars. My chocolate, by the way — I voted for it in the budget.',
    p23_boss: 'The Speaker. Gavel in hand, the rules in his head, everything else in his pockets.',

    first_coin: {
      clean: 'A coin. Small, shiny, nobody’s. "Nobody’s" is what we in the Rada call budget money.',
      any: 'Another coin. One is an accident. Two is a trend. Three is a scheme.',
    },
    coin: [
      'Clink. A pleasant sound. The sound of spending optimisation.',
      'Another one. I am not taking, I am accumulating.',
      'Who leaves money lying on the street? Mismanagement.',
      'This is not a bribe. It is a thank-you. A small one. For now.',
      'My pockets get heavier. So do my legs.',
    ],
    first_bag: 'A bag of money. No receipt, no stamp. Like in the good old days.',
    bag: [
      'Another bag. I can almost hear a hospital crying somewhere.',
      'A bag. Modest, nothing flashy. Like my official income.',
      'Heavy. Like somebody’s pension for ten years.',
    ],
    trap: {
      any: 'A marked bill. Of course. They always mark the prettiest ones.',
      wanted: 'A marked bill. NABU is not even hiding any more. I must have spoiled them.',
    },
    question_block: 'A surprise box. Like a tender: you never know what is inside, but you always know who wins.',

    bribe_ok: [
      'Deal. I love people who understand half a banknote.',
      'Taken. Everybody takes. The trick is to give on time.',
      'A constructive dialogue. I spoke in money, he answered in silence.',
    ],
    bribe_cop: 'The officer took it. Did not even haggle. Police reform, you say?',
    bribe_fail: [
      'Refused. A man of principle. People like that do not last long. In office.',
      'Refused. Offended, even. I probably did not give enough.',
      'Not taking. The world is going to hell — honest people at every step.',
    ],
    flash: {
      clean: 'Camera flash. It will be a nice photo: I am carrying nothing. Let them print it.',
      any: 'Flash! Tomorrow on the front page: "MP out for a walk. With a sack".',
    },
    hurt_oldlady: [
      'A granny’s walking stick across my back. The election campaign, live.',
      'Ouch. Granny’s stick weighs more than my mandate.',
    ],
    hit_chestnut: 'A chestnut to the forehead. Nobody has ever criticised me like that.',
    stun_civilian: [
      'I knocked out a granny with a chestnut. Deep in my soul I feel ashamed. Very deep.',
      'A child lies there with stars over his head. My conscience quietly writes it down in a notebook.',
    ],
    stun_journalist: 'A journalist took a chestnut. Freedom of speech winced a little.',

    conscience_warn: {
      any: 'Something aches in my chest. Not my heart — that has been empty for a while. My conscience. It is waking up.',
      drunk: 'Through the fog my conscience mumbles something about "giving it all back to the people". Shush.',
    },
    conscience_freeze: [
      'My conscience speaks. My legs won’t move. All the hospitals that were never built flash before my eyes.',
      'Suddenly I remember my mother. "Son, just don’t go into politics". I didn’t listen.',
      'I am paralysed by remorse. They say MPs don’t get that. They lie.',
      'My conscience demands a confession. I demand a lawyer. It is a draw for now.',
    ],
    conscience_quiet: 'Silence. My conscience has gone to sleep. Let it rest — it has a busy day tomorrow.',
    shop_buy: {
      any: 'Whisky. Price: three bribes. The shop assistant did not even look up. A professional.',
    },
    shop_no_money: {
      clean: 'No money. Not a single hryvnia. For the first time in my life that sounds like a compliment.',
      any: 'No money. I gave it all away. A generous soul.',
    },
    drink_whiskey: [
      'A sip of whisky. My conscience softens. So do my knees.',
      'Scotch. Aged twelve years. Like my investigation.',
      'Whisky with a stag on the label. The stag is me. Noble and slightly hunted.',
    ],
    drink_vodka: [
      'Soviet vodka. Sixty years in the basement. My conscience did not just go quiet — it emigrated.',
      'Vodka from the Rada basement. It tastes like a five-year plan: bitter, but they promised it would get better.',
    ],
    drunk_walk: [
      'The ground is swaying. Or maybe it is my ratings.',
      'I am perfectly sober. The world just walks in zigzags.',
      'Hic. Excuse me. That was not me, that was the budget deficit.',
    ],
    hangover: 'The buzz is gone. What is left is a headache and my conscience. Two of them in one head is a crowd.',

    tier_1: 'Noticed. The first questions on social media. Never mind, they will chatter and forget.',
    tier_2: 'Investigative journalists are interested in me. Time to think about a second passport.',
    tier_3: 'NABU has opened a case. I have opened a bottle. Everyone minds their own business.',
    tier_4: 'Everyone is looking for me. Even those I owe money. Especially those I owe money.',

    checkpoint: {
      clean: 'A checkpoint. Clean hands, empty pockets. A strange feeling — like putting on a fresh shirt for the first time.',
      corrupt: 'A checkpoint. I counted it again. Not enough. It is never enough.',
      wanted: 'A checkpoint. Time to catch my breath. And figure out which country has no extradition treaty.',
    },
    secret_found: 'A secret passage. Every respectable MP should have a secret passage. I have two already.',
    boss_beaten: 'Defeated. Without a single bribe. I can hardly believe it myself.',
    boss_bribed: 'A deal. He is happy, I am happy. Only the budget is unhappy, but nobody asked it.',
    time_low: 'Time is running out. Like my ratings before an election.',
    start_e31: {
      clean: 'A party in a Pechersk palace. I was invited as "promising". I do not belong here, and the bandits can tell.',
      corrupt: 'A party for insiders. Bandits nod at me like an old friend. Nice. And scary.',
      wanted: 'Every second guest here is wanted. For the first time in my life I blend in.',
    },
    e31_pool: 'A pool with pink lights. They say budgets and competitors have both been drowned in it.',
    e31_dj: 'The DJ plays a folk classic as techno. Patriotism for export.',
    e31_safe: 'A safe. Open. Empty. Somebody got here first.',
    mafia_offer: 'There he is. The boss. Briefcase in hand, cigar in his teeth. My whole career led here.',
    mafia_yes: 'I said yes. The briefcase is heavy, the champagne is light. What could go wrong?',
    mafia_no: 'I said no. The room went very quiet. Even the DJ stopped the music.',
    start_e32: {
      clean: 'A block district. The sun sets behind the panel blocks, it smells of shawarma and linden trees. Nobody here knows my face. Wonderful.',
      corrupt: 'Troieshchyna. They recognise me. Grannies from balconies, gopniks from benches, citizens with eggs. They must have seen my billboards.',
      wanted: 'No jacket, no money, wanted. Every balcony looks at me like a gun sight.',
    },
    e32_debris: 'The balconies here are held up by a promise. And by rebar that somebody apparently stole as well.',
    e32_court: 'The sport court. Gopniks squatting on their heels — that means a meeting. I am on the agenda.',
    e32_dogs: 'The dog park. Citizens with dogs. Dogs, unlike voters, remember everything.',
    e32_bridge: {
      clean: 'The wave bridge. They say it is the most beautiful in Kyiv. I walk calmly — I have nothing to fear.',
      any: 'The wave bridge. My godfather’s company won the tender. I remember how much concrete went in. Or rather, how much did not.',
    },
    e32_river: 'The riverside. A sunset over the bay. If it were not for the gopniks and detectives — a perfect date.',
    e32_street: 'A street with trolleybus wires. The taxi is close. As long as I can afford it.',
    e32_boss: 'Three guys in tracksuits. "Hey, uncle…" — in Kyiv, the most important negotiations start like that.',
    taxi_paid: 'Five bribes for a taxi. The most honestly spent money of my whole term.',
    life_letter: 'A letter from voters. Handwritten, full of typos and sincere: "Thank you for not stealing." Breathing feels easier.',
    life_score: 'They say people notice when you work instead of "solving issues". Nice.',
    taxi_salary: 'My MP salary covered the taxi. Strange: you can actually live on a salary.',
    taxi_free: 'The driver recognised me: "You’re the one who doesn’t take? Get in, it’s free." For the first time honesty paid in cash.',
    taxi_no_money: 'There is a taxi but no money. Like the budget: the project exists, the funding does not.',
    start_e33: {
      clean: 'The station. A train west, a third-class ticket, a salary in my pocket. Sounds like the start of a good book.',
      corrupt: 'The station. More police than passengers. They seem to be waiting for my train too.',
      wanted: 'The station is crawling with cops. My photo hangs next to the timetable. I look rather good in it.',
    },
    ticket_bought: 'Ticket bought. For the first time in years I pay for something myself.',
    ticket_salary: 'My MP salary arrived. Turns out it is quite enough for a third-class ticket.',
    ticket_no_money: 'The ticket office. A ticket costs five. I have nothing. The state in miniature.',
    train_no_ticket: 'The conductor guards the door like NABU guards a case file. No ticket, no entry.',
    e33_board: 'The board: "Kyiv — Przemyśl". It sounds like a promise. Or like a warning.',
    e33_boss: 'The train. The doors are open. Ahead is either Europe or the consequences.',
    level_clear: {
      clean: 'Another honest day. If this goes on, they will re-elect me. Or lock me up for suspicious honesty.',
      corrupt: 'Made it. Heavy pockets, heavy conscience. Tomorrow is a new day and new bags.',
      wanted: 'Made it. A tail of journalists and detectives behind me. Like a rock star. Only without the applause.',
    },
  },
};
