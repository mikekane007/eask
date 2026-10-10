import type { Person } from '../types';

export const ACCRA_PEOPLE: Person[] = [
  {
    id: 'kwame',
    name: 'Kwame',
    role: 'Physics student',
    shirt: 0x2e86c1,
    req: 0,
    spot: ['h', 1, 0, 0.9],
    rounds: [
      {
        q: 'Chale, I study physics at Legon. Science explains how everything works. Why would I need God?',
        a: [
          [
            "Science tells us how things work. I'm curious, what do you think about why there is anything at all?",
            'good',
            'You respected his learning and asked a real question. Science explains how; it cannot say why anything exists.',
            'Romans 1:20; Psalm 19:1',
          ],
          [
            'Many great scientists believed in God, like Isaac Newton.',
            'ok',
            'True, but naming famous believers does not answer his question. Engage his own thinking.',
            'Acts 17:22-28',
          ],
          [
            'Science is from the devil. You need to drop it.',
            'bad',
            "This dismisses truth God made and closes the conversation. All truth is God's truth.",
            'Colossians 4:6',
          ],
        ],
      },
      {
        q: 'Okay, maybe something started the universe. But a man rising from the dead? How can that be real?',
        a: [
          [
            "That's the key question. The tomb was empty, hundreds saw Him alive, and His followers died rather than deny it. Will you look at the evidence with me?",
            'good',
            'The resurrection is the centre of the faith, and it happened in history. Inviting him to investigate respects his mind.',
            '1 Corinthians 15:3-8',
          ],
          [
            'You just have to believe it by faith.',
            'ok',
            'Faith matters, but Christian faith rests on real events that were witnessed and written down.',
            'Luke 1:1-4',
          ],
          [
            "If you don't believe it, you'll burn.",
            'bad',
            'A threat before any explanation sounds like manipulation and hardens hearts.',
            '2 Timothy 2:24-25',
          ],
        ],
      },
      {
        q: "Hmm. Suppose it's true. What would it mean for me?",
        a: [
          [
            'It means Jesus is who He said He is. He died for our sins, rose again, and invites you to trust and follow Him.',
            'good',
            'A clear gospel: who Jesus is, what He did, and how to respond.',
            'Romans 10:9; 1 Corinthians 15:3-4',
          ],
          [
            'It means you should start coming to church.',
            'ok',
            'Church matters, but point him to Jesus first. Church follows faith.',
            'John 1:12',
          ],
          [
            "It means you'll finally have peace and success in life.",
            'bad',
            'This sells benefits instead of Christ. Jesus promised trouble in this world, and Himself.',
            'John 16:33',
          ],
        ],
      },
    ],
  },

  {
    id: 'abena',
    female: true,
    name: 'Auntie Abena',
    role: 'Market trader',
    shirt: 0xd9822b,
    req: 0,
    spot: ['v', 1, 2, 0.4],
    rounds: [
      {
        q: "My dear, I go to church every Sunday and I pay my tithe. I'm already a good person.",
        a: [
          [
            "That's good to hear. Can I ask: if you stood before God today, what would you tell Him for why He should accept you?",
            'good',
            'A gentle diagnostic question shows what she is really trusting in.',
            '2 Corinthians 13:5',
          ],
          [
            'Church attendance is important, keep it up.',
            'ok',
            'Encouraging, but it leaves her trusting in her own record.',
            'Matthew 7:21-23',
          ],
          [
            'Church people are the worst hypocrites.',
            'bad',
            'Attacking her does nothing to help her see her need.',
            'Ephesians 4:15',
          ],
        ],
      },
      {
        q: "I would tell Him I tried my best, and I'm better than most people.",
        a: [
          [
            "The Bible says all of us fall short, so even our best can't pay what we owe. That's exactly why Jesus came.",
            'good',
            'You named the problem kindly and pointed to the solution.',
            'Romans 3:23; Isaiah 64:6',
          ],
          [
            'Nobody is perfect, but God is merciful.',
            'ok',
            "True but vague. God's mercy comes through Christ, not around Him.",
            'Romans 3:24-26',
          ],
          [
            "Then you're fine. God sees your heart.",
            'bad',
            'This affirms salvation by good works, which the Bible rejects.',
            'Ephesians 2:8-9',
          ],
        ],
      },
      {
        q: 'So my good works count for nothing?',
        a: [
          [
            "They can't save you. But once Jesus saves you, good works become a thank-you to Him, not a payment.",
            'good',
            'Grace first, then works as fruit. That keeps both in their right place.',
            'Ephesians 2:8-10',
          ],
          [
            'Works are good, but you need faith too.',
            'ok',
            'This mixes faith and works as if they combine to save. Salvation is by grace through faith; works follow.',
            'Galatians 2:16',
          ],
          [
            "Yes, they're worthless. Stop wasting your time.",
            'bad',
            'Harsh, and it misrepresents Scripture. God prepared good works for His people to do.',
            'Ephesians 2:10',
          ],
        ],
      },
    ],
  },

  {
    id: 'yaw',
    name: 'Yaw',
    role: 'Taxi driver',
    shirt: 0xf2b705,
    req: 0,
    spot: ['h', 3, 0, 0.7],
    rounds: [
      {
        q: 'Massa, I drive taxi from morning till night. If I give my life to Jesus, will He make me rich?',
        a: [
          [
            'Jesus offers something better than money: forgiveness and life with God. And He does care about your daily needs.',
            'good',
            "Honest about what Jesus promises, without dismissing the man's real struggle.",
            'Mark 8:36; Matthew 6:33',
          ],
          [
            'God blesses those who are faithful to Him.',
            'ok',
            'True in a sense, but it leaves him thinking faith is a business deal.',
            'Matthew 6:19-21',
          ],
          [
            'Yes! Sow a seed offering today and your breakthrough will come.',
            'bad',
            'This is the prosperity gospel. The love of money is a root of all kinds of evil.',
            '1 Timothy 6:9-10',
          ],
        ],
      },
      {
        q: "Then why should I follow Him if I'll still be struggling?",
        a: [
          [
            "Because He's worth it. He walks with you in the struggle, and what He gives can never be taken away.",
            'good',
            'You pointed to Christ Himself as the treasure.',
            'Philippians 4:12-13; Hebrews 13:5',
          ],
          [
            "Maybe you're struggling because of sin in your life.",
            'ok',
            'Sometimes true, but you assumed it. Hardship is not always punishment.',
            'John 9:1-3',
          ],
          [
            "You won't struggle if your faith is strong enough.",
            'bad',
            "False. Paul had great faith and still suffered. God's grace is enough in weakness.",
            '2 Corinthians 12:9',
          ],
        ],
      },
      {
        q: 'Okay. So what does He actually want from me?',
        a: [
          [
            'To turn from your sins and trust Him as your Lord and Saviour.',
            'good',
            "Repent and believe: Jesus' own summary of the response He calls for.",
            'Mark 1:15',
          ],
          [
            'To be a good man and help people.',
            'ok',
            "That's the fruit, not the root. Good living follows trusting Christ.",
            'John 15:5',
          ],
          ['Ten percent of your daily sales.', 'bad', 'This reduces the gospel to money.', 'Isaiah 55:1'],
        ],
      },
    ],
  },

  {
    id: 'efua',
    female: true,
    name: 'Efua',
    role: 'Recently widowed',
    shirt: 0x6c3483,
    req: 15,
    spot: ['v', 3, 1, 0.5],
    rounds: [
      {
        q: 'My husband died three months ago. Where was God when that happened?',
        a: [
          [
            "I'm so sorry, Efua. Would you tell me about him?",
            'good',
            'Listen first. Grief needs presence before explanations.',
            'Romans 12:15',
          ],
          [
            'God has a plan in everything.',
            'ok',
            'True, but too fast. In fresh grief it can feel dismissive.',
            'Romans 8:28; Ecclesiastes 3:7',
          ],
          [
            'Maybe God was punishing your family.',
            'bad',
            "Cruel and presumptuous. God rebuked Job's friends for speaking like this.",
            'Job 42:7',
          ],
        ],
      },
      {
        q: "He was a good man. I feel so alone. Honestly, I'm angry with God.",
        a: [
          [
            'Many in the Bible told God they were angry, like in the Psalms. He can handle your honesty, and He is close to the broken-hearted.',
            'good',
            'Honest lament is a form of faith. You gave her permission to bring it to God.',
            'Psalm 34:18; Psalm 13',
          ],
          ["You shouldn't be angry with God.", 'ok', 'This shuts down the honest lament Scripture models.', 'Psalm 88'],
          ["Stop crying. He's in a better place now.", 'bad', 'Dismissive. Even Jesus wept.', 'John 11:35'],
        ],
      },
      {
        q: 'Does God even care?',
        a: [
          [
            "Jesus wept at His friend's grave, even knowing He would raise him. He cares. And because He rose, death is not the end.",
            'good',
            "You showed God's compassion and the hope of resurrection together.",
            'John 11:33-35; 1 Thessalonians 4:13-14',
          ],
          [
            'Of course He cares. Just pray more.',
            'ok',
            "Prayer is good, but this adds a burden instead of showing her God's heart.",
            'Matthew 11:28',
          ],
          [
            "If you had more faith, he wouldn't have died.",
            'bad',
            'False and deeply wounding. Faithful people die too.',
            'Hebrews 11:13',
          ],
        ],
      },
    ],
  },

  {
    id: 'kofi',
    name: 'Opanin Kofi',
    role: 'Family elder',
    shirt: 0x7b241c,
    req: 20,
    spot: ['h', 2, 3, 0.3],
    rounds: [
      {
        q: 'My family consults the shrine of our ancestors. It keeps us protected. Why should I change?',
        a: [
          [
            'I respect how much you care for your family. Can I ask, does the protection ever bring you real peace?',
            'good',
            'Respect first, then a question that explores the fear underneath.',
            'Acts 17:22-23',
          ],
          [
            'The Bible forbids consulting spirits.',
            'ok',
            'True, but leading with the law before any relationship rarely opens a heart.',
            'Deuteronomy 18:10-12',
          ],
          [
            'Your ancestors are demons and your family is cursed.',
            'bad',
            'Insulting his family ends the conversation and misrepresents Christ.',
            '1 Peter 3:15-16',
          ],
        ],
      },
      {
        q: 'Honestly, there is always fear. We must keep giving sacrifices or something bad will happen.',
        a: [
          [
            "Jesus made the final sacrifice, once for all. In Him you don't need to keep buying protection. He has power over every spirit.",
            'good',
            "Christ's finished work answers both the fear and the endless sacrifices.",
            'Hebrews 10:10-14; Colossians 2:15',
          ],
          [
            'Just add Jesus to your protection and pray to Him too.',
            'ok',
            'Jesus is not one more charm. He asks for exclusive trust.',
            'Exodus 20:3; 1 Corinthians 10:21',
          ],
          [
            'Go home and burn the shrine tonight.',
            'bad',
            "Pressure before understanding. Let conviction come from God's Word, not your command.",
            'Acts 19:18-19',
          ],
        ],
      },
      {
        q: 'If I follow Jesus, what happens to my family?',
        a: [
          [
            "Following Jesus doesn't mean dishonouring them. You can love them well and pray they find the same freedom. And we will walk with you.",
            'good',
            'Honour family, hope for their salvation, and offer real community.',
            'Exodus 20:12; Acts 16:31',
          ],
          [
            'You may have to leave them.',
            'ok',
            'Jesus does call us to put Him first, but quoting this out of context makes Him sound against family.',
            'Luke 14:26',
          ],
          [
            "Forget them. They're lost anyway.",
            'bad',
            "Unloving, and it contradicts God's heart for whole households.",
            '1 Timothy 2:4',
          ],
        ],
      },
    ],
  },

  {
    id: 'ama',
    female: true,
    name: 'Ama',
    role: 'Bank teller',
    shirt: 0x16a085,
    req: 25,
    spot: ['v', 4, 3, 0.5],
    rounds: [
      {
        q: "You don't know what I've done. God could never forgive someone like me.",
        a: [
          [
            "You're right, I don't know. But the Bible is full of people who did terrible things and were forgiven. Paul hunted Christians before Jesus saved him.",
            'good',
            "You didn't pry, and you pointed to real people who received grace.",
            '1 Timothy 1:15-16',
          ],
          [
            "Everyone sins. It's not a big deal.",
            'ok',
            'This minimises sin. Grace is amazing precisely because sin is serious.',
            'Romans 5:8',
          ],
          [
            'What did you do? You can tell me.',
            'bad',
            'Prying puts her on trial. She needs grace, not a confession to you.',
            'Proverbs 11:13',
          ],
        ],
      },
      {
        q: "Even if He forgives, I keep feeling dirty. I can't forget it.",
        a: [
          [
            "When God forgives, He removes your sin as far as the east is from the west. Jesus carried the shame on the cross so you don't have to.",
            'good',
            "You addressed both guilt and shame with God's promises.",
            'Psalm 103:12; Hebrews 12:2',
          ],
          [
            'Try doing good things to make up for it.',
            'ok',
            "Works can't wash the conscience. Only Christ's blood can.",
            'Hebrews 9:14',
          ],
          [
            "Maybe that feeling is God telling you you're not forgiven.",
            'bad',
            "This contradicts God's promise and deepens her despair.",
            '1 John 1:9',
          ],
        ],
      },
      {
        q: 'How do I receive that forgiveness?',
        a: [
          [
            "Tell Him honestly, turn from it, and trust that Jesus' death paid for it. Would you like to pray together now?",
            'good',
            "Clear and immediate. You didn't let the moment pass.",
            '1 John 1:9; Romans 10:13',
          ],
          [
            "Go and see the pastor. He'll explain it.",
            'ok',
            'Connecting her to a church is good, but you can lead her to Christ right now.',
            '2 Corinthians 6:2',
          ],
          [
            "Fast for 21 days first to prove you're sorry.",
            'bad',
            'Adds conditions to grace. Forgiveness is a gift, not a reward.',
            'Romans 4:4-5',
          ],
        ],
      },
    ],
  },

  {
    id: 'mensah',
    name: 'Mr Mensah',
    role: 'Retired teacher',
    shirt: 0x566573,
    req: 30,
    spot: ['h', 4, 2, 0.7],
    rounds: [
      {
        q: "These pastors are all thieves. They chop the people's money. Why should I listen to you?",
        a: [
          [
            'Some leaders have done real harm, and that grieves me too. Jesus Himself was angry at religious people who exploited others.',
            'good',
            'You acknowledged the hurt honestly and showed Jesus is on the side of the wronged.',
            'Matthew 21:12-13; Matthew 23:13-14',
          ],
          [
            'Not all pastors are like that.',
            'ok',
            'True, but it sounds defensive. Acknowledge the wrong first.',
            'James 3:1',
          ],
          [
            "Touch not my anointed! Don't speak against men of God.",
            'bad',
            'This verse is often misused to silence criticism. It does not protect wrongdoing.',
            'Psalm 105:15; 1 Timothy 5:20',
          ],
        ],
      },
      {
        q: 'My mother gave everything to one pastor, and then he disappeared.',
        a: [
          [
            "I'm so sorry. That was wrong. I'm not asking you to trust a pastor. I'm asking you to look at Jesus, who gave His life instead of taking.",
            'good',
            'You separated Jesus from those who abused His name.',
            'Mark 10:45',
          ],
          ['God will judge that man.', 'ok', "True, but it doesn't move him toward Christ.", 'Romans 12:19'],
          [
            'Your mother should have been more careful.',
            'bad',
            'Blaming the victim adds to the wound.',
            'Proverbs 31:8-9',
          ],
        ],
      },
      {
        q: 'If I wanted to know Jesus without all the drama, where would I start?',
        a: [
          [
            'Read the Gospel of Mark with me, and find a church where the Bible is taught and leaders are accountable.',
            'good',
            'Scripture first, then a healthy church. Test everything by the Word.',
            'Acts 17:11',
          ],
          [
            "Just follow Jesus alone. You don't need church.",
            'ok',
            'Understandable after hurt, but believers need each other.',
            'Hebrews 10:24-25',
          ],
          [
            'Come to my church. Our pastor is the real one.',
            'bad',
            'This points to a man again instead of to Christ.',
            '1 Corinthians 3:5-7',
          ],
        ],
      },
    ],
  },

  {
    id: 'esi',
    female: true,
    name: 'Esi',
    role: 'Nurse',
    shirt: 0xec7063,
    req: 40,
    spot: ['v', 2, 4, 0.4],
    rounds: [
      {
        q: 'All religions lead to the same God. Why do Christians insist Jesus is the only way?',
        a: [
          [
            "That's a fair question. Christians didn't make it up; Jesus said it Himself. Could I share why He claimed that?",
            'good',
            "You took the question seriously and pointed to Jesus' own words.",
            'John 14:6',
          ],
          [
            'Because Christianity is the best religion.',
            'ok',
            'Sounds arrogant, and points to a religion rather than a Person.',
            'Acts 4:12',
          ],
          [
            'Other religions are evil and their followers are fools.',
            'bad',
            'Insulting people never wins them. Be gentle and respectful.',
            '1 Peter 3:15-16',
          ],
        ],
      },
      {
        q: "Isn't it arrogant to say only one way is right?",
        a: [
          [
            "It would be arrogant if I said I earned it. But Christianity says nobody earns it. It's God's gift, so there's no room for pride.",
            'good',
            'Grace removes boasting. That is the opposite of arrogance.',
            'Ephesians 2:8-9; 1 Corinthians 1:31',
          ],
          [
            'Truth is truth, whether it sounds arrogant or not.',
            'ok',
            'Correct, but cold. Speak the truth in love.',
            'Ephesians 4:15',
          ],
          [
            "You're right, maybe they're all valid.",
            'bad',
            'This gives up the gospel to avoid discomfort.',
            'Galatians 1:6-8',
          ],
        ],
      },
      {
        q: 'So what makes Jesus different from other great teachers?',
        a: [
          [
            'Other teachers show a way. Jesus said He is the way. He claimed to forgive sins and proved it by rising from the dead.',
            'good',
            'You pointed to His unique claims and the resurrection that backs them.',
            'Mark 2:5-12; Romans 1:4',
          ],
          [
            'He did more miracles than the others.',
            'ok',
            'Partly true, but His identity, death and resurrection are the heart of it.',
            'John 20:30-31',
          ],
          ['Christians are more successful in life.', 'bad', 'Not true, and not the point.', '1 Corinthians 1:26-29'],
        ],
      },
    ],
  },

  {
    id: 'daniel',
    name: 'Daniel',
    role: 'Used to lead worship',
    shirt: 0x1e8449,
    req: 50,
    spot: ['h', 1, 4, 0.5],
    rounds: [
      {
        q: "I was a Christian in SHS. I even led worship. But I stopped. God doesn't want me back.",
        a: [
          [
            'Do you remember the son who left home? His father saw him far off and ran to welcome him.',
            'good',
            "The prodigal son is God's own picture of welcome for those who wandered.",
            'Luke 15:20',
          ],
          [
            'Maybe you were never truly saved.',
            'ok',
            'This presumes to know his heart and can crush a bruised reed.',
            'Isaiah 42:3',
          ],
          [
            "You'd better come back before it's too late, or else.",
            'bad',
            "Fear-driven pressure. Point him to the Father's love.",
            'Romans 2:4',
          ],
        ],
      },
      {
        q: "I've done things since then that I'm ashamed of.",
        a: [
          [
            "God's grace is bigger than our wandering. If we confess, He is faithful to forgive.",
            'good',
            'Grace and confession, the way back home.',
            '1 John 1:9; 1 John 2:1',
          ],
          [
            "Just come back to church and you'll be fine.",
            'ok',
            'Church helps, but the real need is to return to God Himself.',
            'Hosea 14:1-2',
          ],
          [
            "You'll need to prove yourself before God accepts you again.",
            'bad',
            "God doesn't put returning children on probation.",
            'Luke 15:22-24',
          ],
        ],
      },
      {
        q: 'So how do I start again?',
        a: [
          [
            'Talk to God honestly today, open His Word again, and let a few believers walk with you.',
            'good',
            'Repentance, Scripture and community: practical and grace-filled.',
            'James 5:16; Hebrews 10:24-25',
          ],
          ['Wait until you feel ready.', 'ok', 'Feelings can wait. Today is the day to return.', '2 Corinthians 6:2'],
          [
            'Start by giving a big offering.',
            'bad',
            "You can't buy your way back. Christ already paid.",
            'Psalm 51:16-17',
          ],
        ],
      },
    ],
  },

  {
    id: 'akos',
    female: true,
    name: 'Auntie Akos',
    role: 'Seamstress',
    shirt: 0xf4d03f,
    req: 60,
    spot: ['v', 3, 3, 0.6],
    rounds: [
      {
        q: "My neighbour's life changed completely after she believed in Jesus. What must I do to be saved?",
        a: [
          [
            'Believe in the Lord Jesus. Can I explain who He is and what He did for you?',
            'good',
            'Answer the question directly, as Paul did with the jailer.',
            'Acts 16:30-31',
          ],
          [
            "Come to church on Sunday and they'll explain.",
            'ok',
            "Church is good, but she asked you now. Don't miss the moment.",
            'Romans 10:14',
          ],
          [
            'First you must stop wearing trousers and earrings.',
            'bad',
            'Adding rules to the gospel turns grace into law.',
            'Galatians 3:2-3',
          ],
        ],
      },
      {
        q: 'Please explain. Why do I need saving?',
        a: [
          [
            "God made us to know Him, but we've all turned away, and sin separates us from Him. Its wages is death, but God offers the free gift of eternal life in Jesus.",
            'good',
            'Creation, sin, and the gift in Christ, clearly and kindly.',
            'Romans 3:23; Romans 6:23',
          ],
          [
            'Because the world is ending soon.',
            'ok',
            'Judgment is real, but the core issue is sin and our separation from God.',
            'Isaiah 59:2',
          ],
          [
            'Because you are a bad woman.',
            'bad',
            'Singling her out is unkind and misses that all have sinned.',
            'Romans 3:10-12',
          ],
        ],
      },
      {
        q: 'I believe. What do I do now?',
        a: [
          [
            "Let's pray together and tell Jesus you trust Him. Then let's get you a Bible and connect you with a church family.",
            'good',
            'Confession, then discipleship. New believers need to be walked with.',
            'Romans 10:9-10; Acts 2:42',
          ],
          [
            "That's it, you're done.",
            'ok',
            'Salvation is complete in Christ, but Jesus commands us to make disciples, not just converts.',
            'Matthew 28:19-20',
          ],
          [
            'Now you must pay for special deliverance prayers.',
            'bad',
            'Charging for grace is exploitation.',
            'Acts 8:18-20; Isaiah 55:1',
          ],
        ],
      },
    ],
  },
];
