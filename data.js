window.NeuroPassData = (() => {
  const tracks = [
    { id:'spark', name:'Spark', days:30, hours:1.5, guaranteed:180, target:220, perfectProb:0, restDays:2 },
    { id:'build', name:'Build', days:45, hours:2, guaranteed:220, target:260, perfectProb:0, restDays:4, restDaysSource:'interpolated' },
    { id:'rise', name:'Rise', days:60, hours:2.5, guaranteed:260, target:300, perfectProb:2, restDays:5 },
    { id:'advance', name:'Advance', days:75, hours:3, guaranteed:300, target:330, perfectProb:8, restDays:7, restDaysSource:'interpolated' },
    { id:'elite', name:'Elite', days:90, hours:3.5, guaranteed:330, target:360, perfectProb:18, restDays:8 },
    { id:'master', name:'Master', days:120, hours:4, guaranteed:360, target:380, perfectProb:35, restDays:12, restDaysSource:'interpolated' },
    { id:'legend', name:'Legend', days:150, hours:4.5, guaranteed:380, target:395, perfectProb:60, restDays:15, restDaysSource:'interpolated' },
    { id:'perfect', name:'Perfect', days:180, hours:5, guaranteed:395, target:400, perfectProb:85, restDays:18 }
  ];

  const subjects = [
    { id:'english', name:'English Language', short:'English', icon:'Aa' },
    { id:'mathematics', name:'Mathematics', short:'Maths', icon:'∑' },
    { id:'biology', name:'Biology', short:'Biology', icon:'🧬' },
    { id:'chemistry', name:'Chemistry', short:'Chemistry', icon:'⚗' },
    { id:'physics', name:'Physics', short:'Physics', icon:'⚡' },
    { id:'economics', name:'Economics', short:'Economics', icon:'₦' }
  ];

  const topicMap = {
    english: ['Comprehension','Concord','Antonyms & Synonyms','Oral English / Phonetics','Tenses'],
    mathematics: ['Indices & Logarithms','Quadratic Equations','Statistics & Probability','Mensuration','Surds'],
    biology: ['Genetics & Heredity','Ecology & Environment','Nutrition & Digestion','Cell Biology & Structure','Excretion'],
    chemistry: ['Mole Concept & Calculations','Organic Chemistry','Periodic Table & Trends','Electrolysis','Chemical Equilibrium'],
    physics: ['Mechanics & Motion','Waves & Optics','Electricity & Magnetism','Heat & Temperature'],
    economics: ['Supply & Demand','National Income','Money, Banking & Finance','Population & Development']
  };

  let tIndex = 1;
  const topics = [];
  subjects.forEach(subject => {
    (topicMap[subject.id] || []).forEach((name, i) => topics.push({
      id:`topic_${tIndex++}`,
      subjectId:subject.id,
      name,
      powerTopic:true,
      frequency10: Math.max(8, 10 - (i % 3)),
      modeledShareNote:'Power Topic status is based on a modeled frequency rule until validated with licensed source data.'
    }));
  });

  const lessons = [
    {
      id:'lesson_logarithms', subjectId:'mathematics', topicId: topics.find(t=>t.name==='Indices & Logarithms').id,
      title:'Logarithms: Turning multiplication into addition', complexity:'complex', duration:20,
      see:{ icon:'log', title:'A logarithm asks: what power gives this number?', lines:[
        'If 10² = 100, then log₁₀(100) = 2.',
        'The base tells you which number is being raised.',
        'The answer is the power, not the final number.'
      ]},
      hear:{ text:'Think of it like asking how many times you need to multiply the base by itself to reach the target. If ten times ten gives one hundred, then the logarithm of one hundred base ten is two.' },
      recall:[
        {q:'What does the answer to a logarithm represent?', a:'The power or exponent'},
        {q:'If 2³ = 8, what is log₂(8)?', a:'3'},
        {q:'What is the base in log₁₀(1000)?', a:'10'}
      ],
      alternateAnalogy:'Imagine floors in a building. The base is the lift step size, and the logarithm tells you how many floors of repeated multiplication you climbed.'
    },
    {
      id:'lesson_concord', subjectId:'english', topicId: topics.find(t=>t.name==='Concord').id,
      title:'Concord: Matching subjects and verbs', complexity:'moderate', duration:15,
      see:{ icon:'Aa', title:'The subject and verb must agree in number', lines:[
        'Singular subject: He runs.',
        'Plural subject: They run.',
        'Ignore distracting words between the subject and verb.'
      ]},
      hear:{ text:'Think of subject and verb agreement like matching a pair of shoes. A singular subject needs the singular verb form, and a plural subject needs the plural verb form.' },
      recall:[
        {q:'Which is correct: The list of items is or are on the table?', a:'is'},
        {q:'Which part controls the verb in concord?', a:'The main subject'},
        {q:'Complete: They ___ ready.', a:'are'}
      ],
      alternateAnalogy:'Treat the main subject as the captain. Other nouns may be nearby, but the captain decides the verb.'
    },
    {
      id:'lesson_genetics', subjectId:'biology', topicId: topics.find(t=>t.name==='Genetics & Heredity').id,
      title:'Genetics: From genes to traits', complexity:'moderate', duration:15,
      see:{ icon:'🧬', title:'Genes carry instructions for inherited traits', lines:[
        'Genes are sections of DNA.',
        'Different forms of a gene are called alleles.',
        'Genotype influences phenotype.'
      ]},
      hear:{ text:'Think of DNA like a large recipe book. A gene is one recipe, alleles are different versions of that recipe, and the trait you can observe is the finished dish.' },
      recall:[
        {q:'What is an allele?', a:'A form or version of a gene'},
        {q:'What is phenotype?', a:'An observable trait'},
        {q:'Where are genes found?', a:'On DNA / chromosomes'}
      ],
      alternateAnalogy:'Genes are like settings in a game character builder. The combination of settings is the genotype, while what you see on screen is the phenotype.'
    }
  ];

  const questions = [
    {id:'q1',exam:'JAMB',year:'Demo',subjectId:'mathematics',topic:'Indices & Logarithms',stem:'If log₁₀(1000) = x, what is x?',options:['1','2','3','10'],answer:2,explanation:'10 × 10 × 10 = 1000, so the exponent is 3.',source:'Illustrative demo question, not an official past question.'},
    {id:'q2',exam:'JAMB',year:'Demo',subjectId:'mathematics',topic:'Indices & Logarithms',stem:'Which expression is equivalent to log₂(8)?',options:['1','2','3','8'],answer:2,explanation:'2³ = 8, therefore log₂(8) = 3.',source:'Illustrative demo question, not an official past question.'},
    {id:'q3',exam:'JAMB',year:'Demo',subjectId:'english',topic:'Concord',stem:'Choose the correct sentence.',options:['The group of players are ready.','The group of players is ready.','The group of players were readying.','The group of players be ready.'],answer:1,explanation:'The subject is “group”, which is singular, so “is” is correct.',source:'Illustrative demo question, not an official past question.'},
    {id:'q4',exam:'JAMB',year:'Demo',subjectId:'biology',topic:'Genetics & Heredity',stem:'A different form of the same gene is called a:',options:['chromosome','allele','phenotype','protein'],answer:1,explanation:'An allele is an alternative form of a gene.',source:'Illustrative demo question, not an official past question.'},
    {id:'q5',exam:'WAEC',year:'Demo',subjectId:'chemistry',topic:'Mole Concept & Calculations',stem:'How many moles are in 18 g of water if molar mass is 18 g/mol?',options:['0.5','1','18','36'],answer:1,explanation:'Moles = mass ÷ molar mass = 18 ÷ 18 = 1 mole.',source:'Illustrative demo question, not an official past question.'},
    {id:'q6',exam:'JAMB',year:'Demo',subjectId:'physics',topic:'Mechanics & Motion',stem:'A car travels 120 m in 10 s. What is its average speed?',options:['10 m/s','12 m/s','20 m/s','1200 m/s'],answer:1,explanation:'Average speed = distance ÷ time = 120 ÷ 10 = 12 m/s.',source:'Illustrative demo question, not an official past question.'},
    {id:'q7',exam:'JAMB',year:'Demo',subjectId:'economics',topic:'Supply & Demand',stem:'Other things being equal, a rise in price usually causes quantity demanded to:',options:['rise','fall','remain fixed','double'],answer:1,explanation:'The law of demand states that quantity demanded generally falls as price rises, other things being equal.',source:'Illustrative demo question, not an official past question.'},
    {id:'q8',exam:'JAMB',year:'Demo',subjectId:'english',topic:'Antonyms & Synonyms',stem:'Choose the word closest in meaning to “brief”.',options:['short','angry','wide','late'],answer:0,explanation:'“Brief” can mean short in duration or length.',source:'Illustrative demo question, not an official past question.'},
    {id:'q9',exam:'JAMB',year:'Demo',subjectId:'mathematics',topic:'Statistics & Probability',stem:'What is the mean of 2, 4, 6 and 8?',options:['4','5','6','20'],answer:1,explanation:'(2 + 4 + 6 + 8) ÷ 4 = 20 ÷ 4 = 5.',source:'Illustrative demo question, not an official past question.'},
    {id:'q10',exam:'JAMB',year:'Demo',subjectId:'biology',topic:'Cell Biology & Structure',stem:'Which organelle is mainly responsible for aerobic respiration?',options:['Ribosome','Mitochondrion','Nucleus','Golgi body'],answer:1,explanation:'Most aerobic respiration occurs in the mitochondrion.',source:'Illustrative demo question, not an official past question.'},
    {id:'q11',exam:'JAMB',year:'Demo',subjectId:'chemistry',topic:'Periodic Table & Trends',stem:'Elements in the same group of the periodic table commonly have similar:',options:['atomic masses','chemical properties','numbers of shells','neutron counts'],answer:1,explanation:'Elements in the same group have similar valence electron patterns and therefore similar chemical properties.',source:'Illustrative demo question, not an official past question.'},
    {id:'q12',exam:'JAMB',year:'Demo',subjectId:'physics',topic:'Electricity & Magnetism',stem:'The SI unit of electric current is:',options:['volt','ohm','ampere','watt'],answer:2,explanation:'Electric current is measured in amperes (A).',source:'Illustrative demo question, not an official past question.'},
    {id:'q13',exam:'JAMB',year:'Demo',subjectId:'economics',topic:'Money, Banking & Finance',stem:'Which institution is primarily responsible for monetary policy in Nigeria?',options:['A commercial bank','The central bank','A microfinance bank','A stockbroker'],answer:1,explanation:'A country’s central bank is responsible for monetary policy.',source:'Illustrative demo question, not an official past question.'},
    {id:'q14',exam:'WAEC',year:'Demo',subjectId:'english',topic:'Tenses',stem:'Complete the sentence: By next month, she ___ the course.',options:['completes','completed','will have completed','has completing'],answer:2,explanation:'The future perfect form “will have completed” describes an action completed before a future time.',source:'Illustrative demo question, not an official past question.'},
    {id:'q15',exam:'JAMB',year:'Demo',subjectId:'mathematics',topic:'Quadratic Equations',stem:'What are the roots of x² - 5x + 6 = 0?',options:['1 and 6','2 and 3','-2 and -3','3 and 6'],answer:1,explanation:'x² - 5x + 6 factors as (x - 2)(x - 3).',source:'Illustrative demo question, not an official past question.'}
  ];

  const defaultSettings = {
    dyslexicFont:false,
    fontSize:16,
    lineHeight:1.55,
    letterSpacing:0,
    background:'standard',
    readAloud:true,
    karaoke:false,
    chunkedReading:true,
    syllableAssist:false,
    voiceInput:false,
    visibleTimer:true,
    notifications:true,
    lowEnergyDefault:false,
    reduceMotion:false
  };

  const makeFreshState = () => ({
    version:1,
    authenticated:false,
    onboardingComplete:false,
    currentRole:'student',
    user:{
      id:null, authUserId:null, name:'Student', firstName:'Student', age:null, location:null, email:'',
      examType:'JAMB', examDate:null, subjects:['english','mathematics','biology','chemistry'],
      baselineScore:0, selectedTrackId:'rise', trackStart:null, currentDay:1,
      consistencyRisk:false, schoolDays:[], preferredTimes:[],
      xp:0, level:1, streakDisplay:0, accountabilityOptIn:false,
      settings:{...defaultSettings}
    },
    compliance:{
      rollingAverage:100,
      weekly:[],
      consecutiveBelow70:0,
      status:'active',
      events:[]
    },
    score:{ projected:100, guaranteed:100, confidence:'low', modelVersion:'heuristic-v1.0', updatedAt:null },
    today:{
      emotionalState:null,
      mode:'standard',
      microGoal:'Complete your first short NeuroPass session.',
      sessions:[
        {id:'day1_activation',time:'08:00',title:'Day 1 Activation',meta:'Set your goal and warm up',duration:10,status:'next',subjectId:null},
        {id:'day1_study',time:'16:00',title:'Session 1',meta:'Start with your first selected subject',duration:30,status:'later',subjectId:'english',lessonId:'lesson_concord'},
        {id:'day1_review',time:'19:00',title:'Quick Recall',meta:'5-question recall check',duration:10,status:'later',subjectId:null}
      ]
    },
    sessionsCompleted:0,
    minutesStudied:0,
    reviewsCompleted:0,
    spacedQueue:[],
    mistakeBank:[],
    answers:[],
    mockHistory:[],
    riskSignals:[],
    coach:{
      assigned:{id:null,name:'Not assigned yet',role:'Learning Coach',qualification:''},
      messages:[],
      touchpoints:[]
    },
    guaranteeCase:null,
    postExamOutcomes:[],
    admin:{legalReviewComplete:false,coachesStaffed:false,checks:{},importJobs:[],audit:[],predictiveRules:[]},
    cfaWaitlist:[],
    importedQuestions:[],
    checkInHistory:[],
    waitlist:[],
    demoMode:false,
    restDaysUsed:0,
    offline:{downloadedPacks:[],pendingSync:0,lastSync:null,queue:[]}
  });

  const makeDemoState = () => ({
    version:1,
    authenticated:false,
    onboardingComplete:true,
    currentRole:'student',
    user:{
      id:'student_demo', name:'Tolu A.', firstName:'Tolu', age:17, location:'Lagos', email:'tolu.demo@neuropass.local',
      examType:'JAMB', examDate:'2026-09-28', subjects:['english','mathematics','biology','chemistry'],
      baselineScore:154, selectedTrackId:'elite', trackStart:'2026-06-01', currentDay:72,
      consistencyRisk:true, schoolDays:['Mon','Tue','Wed','Thu','Fri'], preferredTimes:['18:30','20:00'],
      xp:2840, level:9, streakDisplay:0, accountabilityOptIn:false,
      settings:{...defaultSettings, background:'cream', readAloud:true, chunkedReading:true}
    },
    compliance:{
      rollingAverage:84,
      weekly:[88,86,82,79,91,76,74,83,85,84],
      consecutiveBelow70:0,
      status:'active',
      events:[
        {date:'2026-08-04',type:'normal',text:'Rolling compliance held above 80%.'},
        {date:'2026-07-28',type:'warning',text:'One lighter week recovered with two catch-up sessions.'},
        {date:'2026-07-20',type:'normal',text:'Guarantee status remained fully active.'}
      ]
    },
    score:{ projected:318, guaranteed:306, confidence:'medium', modelVersion:'heuristic-v1.0', updatedAt:'2026-08-11T12:00:00Z' },
    today:{
      emotionalState:null,
      mode:'standard',
      microGoal:'Complete one weak-topic lesson and one mixed drill.',
      sessions:[
        {id:'s1',time:'07:00',title:'Morning Activation',meta:'5 reviews + micro-goal',duration:10,status:'done',subjectId:null},
        {id:'s2',time:'08:00',title:'Session 1',meta:'Mathematics, Indices & Logarithms',duration:55,status:'done',subjectId:'mathematics',lessonId:'lesson_logarithms'},
        {id:'s3',time:'15:00',title:'Session 3',meta:'English, comprehension drill',duration:40,status:'next',subjectId:'english',lessonId:'lesson_concord'},
        {id:'s4',time:'18:00',title:'Session 4',meta:'Mixed 15-question drill',duration:30,status:'later',subjectId:null}
      ]
    },
    sessionsCompleted:116,
    minutesStudied:5080,
    reviewsCompleted:246,
    spacedQueue:[
      {id:'r1',topic:'Concord',subjectId:'english',due:'2026-08-11',cycle:3,status:'due'},
      {id:'r2',topic:'Genetics & Heredity',subjectId:'biology',due:'2026-08-11',cycle:2,status:'due'},
      {id:'r3',topic:'Indices & Logarithms',subjectId:'mathematics',due:'2026-08-12',cycle:4,status:'upcoming'},
      {id:'r4',topic:'Mole Concept & Calculations',subjectId:'chemistry',due:'2026-08-13',cycle:2,status:'upcoming'}
    ],
    mistakeBank:[
      {questionId:'q2',subjectId:'mathematics',topic:'Indices & Logarithms',wrongCount:2,consecutiveCorrect:1,nextDue:'2026-08-11',lastAnswerAt:'2026-08-09'},
      {questionId:'q4',subjectId:'biology',topic:'Genetics & Heredity',wrongCount:1,consecutiveCorrect:0,nextDue:'2026-08-11',lastAnswerAt:'2026-08-08'},
      {questionId:'q11',subjectId:'chemistry',topic:'Periodic Table & Trends',wrongCount:1,consecutiveCorrect:2,nextDue:'2026-08-12',lastAnswerAt:'2026-08-10'}
    ],
    answers:[],
    mockHistory:[
      {id:'mock1',date:'2026-07-06',score:238,percent:59.5,timeMin:118,first10:70,last10:50,flagged:8,returned:6,changed:5,changesHelped:3,subjectOrder:['English','Maths','Biology','Chemistry']},
      {id:'mock2',date:'2026-07-13',score:262,percent:65.5,timeMin:116,first10:70,last10:60,flagged:7,returned:7,changed:4,changesHelped:3,subjectOrder:['English','Maths','Biology','Chemistry']},
      {id:'mock3',date:'2026-07-20',score:286,percent:71.5,timeMin:114,first10:80,last10:60,flagged:6,returned:5,changed:3,changesHelped:2,subjectOrder:['Maths','English','Biology','Chemistry']},
      {id:'mock4',date:'2026-08-02',score:304,percent:76,timeMin:111,first10:80,last10:70,flagged:5,returned:5,changed:3,changesHelped:2,subjectOrder:['Maths','English','Biology','Chemistry']}
    ],
    riskSignals:[
      {id:'risk1',type:'consistency',severity:'low',active:true,studentId:'student_demo',title:'Consistency risk flagged at intake',detail:'Student reported abandoning previous apps within two weeks. Day 7 coach touchpoint completed.',trigger:'intake_consistency_risk',createdAt:'2026-06-01'},
      {id:'risk2',type:'plateau',severity:'resolved',active:false,studentId:'student_demo',title:'Mock score plateau cleared',detail:'Method switched to audio-primary for Genetics. Scores improved in the next mock.',trigger:'mock_plateau_2_weeks',createdAt:'2026-07-16'}
    ],
    coach:{
      assigned:{id:'coach_ada',name:'Ada N.',role:'Learning Coach',qualification:'Education and youth learning support'},
      messages:[
        {id:'m1',from:'coach',date:'2026-08-09T10:00:00Z',text:'Your consistency is holding. Today, focus on one weak topic, then stop when the session ends.'},
        {id:'m2',from:'student',date:'2026-08-09T10:12:00Z',text:'Okay, I will do logarithms first.'}
      ],
      touchpoints:[
        {id:'tp1',moment:'Day 7',status:'completed',coach:'Ada N.',date:'2026-06-08',notes:'Student responded well to shorter session framing.'},
        {id:'tp2',moment:'Final 2 weeks',status:'scheduled',coach:'Ada N.',date:'2026-09-14',notes:'Daily 2-minute check-in option begins.'}
      ]
    },
    guaranteeCase:null,
    postExamOutcomes:[],
    admin:{
      legalReviewComplete:false,
      coachesStaffed:false,
      checks:{offlineMode:true,dyslexiaUI:true,rollingCompliance:true,cfaExcluded:true,postExamArchitecture:true},
      importJobs:[],
      audit:[
        {date:'2026-08-11T09:30:00Z',actor:'Admin',action:'Verified rolling compliance configuration'},
        {date:'2026-08-10T14:20:00Z',actor:'Admin',action:'Updated Power Topic taxonomy'}
      ],
      predictiveRules:[
        {id:'open_time',label:'Session open time increasing over 3 days',response:'Offer shorter session',enabled:true},
        {id:'wrong_rate',label:'Wrong answer rate rising over 3 days',response:'Reteach using a different method',enabled:true},
        {id:'mock_plateau',label:'Mock score plateau for 2 weeks',response:'Switch study method',enabled:true},
        {id:'avoidance',label:'App opened and closed within 2 minutes for 3 days',response:'Trigger human-style check-in',enabled:true},
        {id:'burnout',label:'Stressed or tired for 4 days',response:'Insert rest day and notify opted-in partner',enabled:true}
      ]
    },
    cfaWaitlist:[],
    importedQuestions:[],
    offline:{downloadedPacks:['english','mathematics'],pendingSync:0,lastSync:'2026-08-11T11:50:00Z'}
  });

  return { tracks, subjects, topics, lessons, questions, defaultSettings, makeFreshState, makeDemoState };
})();
