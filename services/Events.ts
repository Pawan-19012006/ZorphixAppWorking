// Icon names for use with @expo/vector-icons FontAwesome
// Usage: <FontAwesome name={event.icon} size={24} color={event.color} />
const FaCode = 'code';
const FaTerminal = 'terminal';
const FaLaptopCode = 'laptop';
const FaUndo = 'undo';
const FaCoffee = 'coffee';
const FaPuzzlePiece = 'puzzle-piece';
const FaProjectDiagram = 'sitemap';
const FaLightbulb = 'lightbulb-o';
const FaWrench = 'wrench';
const FaScroll = 'file-text-o';

export const technicalEvents = [
    {
        id: 'pixel-reforge',
        name: 'Pixel Reforge',
        subtitle: 'UI Revamp',
        icon: FaCode,
        color: '#e33e33',
        teamSize: '1-2',
        heads: 'S. Aishwarya (73056 03846), Mohanapriya D (86789 18941)',
        teamMembers: [
            'S. Aishwarya - 73056 03846',
            'Mohanapriya D - 86789 18941',
            'Shanjay - 63807 16338',
            'Vishal S - 79047 72563'
        ],
        whatIsThisEventAbout: 'Pixel Reforge is a two-round UI engineering challenge where teams redesign a given interface to improve usability, responsiveness, and visual appeal. The event tests core frontend skills first, followed by real-world UI enhancement using AI.',
        rules: [
            'Team - 1 to 2 per team',
            'Round 1 – Core UI Fundamentals (No AI)',
            'Teams must design and build a webpage using only frontend technologies (HTML, CSS, JavaScript, React, etc.).',
            'Focus areas include clean layout, responsive design, clear typography, and basic interactivity.',
            'Power Cards may be used strategically during the round',
            'AI tools are not allowed.',
            'Round 2 – Advanced UI Enhancement (AI Allowed)',
            'Shortlisted teams will work on a pre-built frontend project with intentional bugs and issues.',
            'Teams must fix errors, improve responsiveness, add advanced features, and enhance visual quality without modifying the existing structure or core code.',
            'AI tools are allowed, but participants must fully understand and be able to explain every change made.'
        ],
        instructions: [
            'Teams are to bring their own laptops for the event.',
            'Participants may use only the AI tools suggested by the organizers and only when permitted.',
            'Participants must strictly abide by all rules.',
            'VScode platform should be used for coding.'
        ],
        price: 'FREE',
        quote: 'Redesign. Rethink. Reimagine.'
    },
    {
        id: 'promptcraft',
        name: 'PromptCraft',
        subtitle: 'Promptopia',
        icon: FaTerminal,
        color: '#97b85d',
        teamSize: '1-2',
        heads: 'Ashanthika Raja (63836 68658), Jyotsna S (99400 86664)',
        teamMembers: [
            'Ashanthika Raja - 63836 68658',
            'Jyotsna S - 99400 86664',
            'Stefin Jude - 87541 85297',
            'Ramalingam - 98944 25368'
        ],
        whatIsThisEventAbout: 'PromptCraft (Promptopia) is a two-round prompt engineering challenge that tests how well participants convert visual understanding into precise AI prompts. Teams attempt to recreate a given reference image using AI image-generation tools within limited attempts. The event highlights creativity, accuracy, and strategic thinking in effective AI interaction.',
        rules: [
            'Teams may consist of 1–2 members only.',
            'Only AI image-generation tools are permitted; manual editing or post-processing is not allowed.',
            'Each team is limited to 3 prompt attempts per round.',
            'Teams must submit the final generated image along with the exact prompts used.',
            'Judging is based only on the final output.',
            'All Round 2 prompt restrictions must be strictly followed; any violation invalidates the attempt.',
            'The judges\' decision is final and binding.'
        ],
        instructions: [
            'Participants must bring their own laptops, internet access, and personal AI accounts.',
            'Use only AI image-generation tools; manual image editing is strictly prohibited.',
            'Each team gets a maximum of 3 prompt attempts per round—do not exceed this limit.'
        ],
        price: 'FREE',
        quote: 'Where words command intelligence.'
    },
    {
        id: 'algopulse',
        name: 'AlgoPulse',
        subtitle: 'Algo Rhythm',
        icon: FaLaptopCode,
        color: '#ffa500',
        teamSize: '1-2',
        heads: 'Kiruthika M (63829 81249), Amirthavarshini H (98410 75452)',
        teamMembers: [
            'Kiruthika M - 63829 81249',
            'Amirthavarshini H - 98410 75452',
            'Pavadharani - 63790 17912',
            'Pradeep - 93847 43668'
        ],
        whatIsThisEventAbout: 'AlgoPulse (Algo Rhythm) is a high-energy algorithmic coding competition where participants solve programming problems while loud background music plays continuously to create a distraction. The event also includes Advantage and Hindrance tasks to test focus, adaptability, and performance under pressure.',
        rules: [
            'A team may consist of 1–2 members only.',
            'The event consists of two rounds.',
            'Round 1 – Algorithmic Screening: Basic to intermediate algorithmic problems.',
            'Round 2 – Advanced Algorithm Challenge: Advanced problems for shortlisted teams only.',
            'An Advantage Task will be conducted before the event, and the winning team receives a special in-contest advantage.',
            'Hindrance Tasks will be held between rounds to increase distraction.',
            'Evaluation is based only on the rank/score shown on the platform.'
        ],
        instructions: [
            'Bringing laptops is recommended but not mandatory.',
            'Participants must have a valid HackerRank account.',
            'Screen sharing and camera must remain ON throughout the event.',
            'AI tools are strictly prohibited.'
        ],
        price: 'FREE',
        quote: 'Feel the beat of logic.'
    },
    {
        id: 'reverse-coding',
        name: 'Reverse Coding',
        subtitle: 'CodeBack',
        icon: FaUndo,
        color: '#e33e33',
        teamSize: '1-2',
        heads: 'Subha Shree (97877 57657), Kaladevi (63820 30143)',
        teamMembers: [
            'Subha Shree - 97877 57657',
            'Kaladevi - 63820 30143',
            'Mahathi - 98407 51242',
            'Rahul Elango - 63690 13069',
            'Deepak - 81899 14560'
        ],
        whatIsThisEventAbout: 'Think you can crack the code? 🧩💻 Test your analytical and problem-solving skills in Reverse Coding, where you must figure out the logic behind the results. In Reverse Coding, the problem statement remains hidden. Participants rely only on output patterns, sample inputs, or program behavior to uncover the logic and build the solution. It\'s a true test of analytical thinking, pattern recognition, and real-world problem-solving skills.',
        rules: [
            'Team size: 1–2 members',
            'The event consists of two rounds:',
            'Round 1 – Logic Deduction',
            'Round 2 – Advanced Reverse Coding',
            'Each round duration: 30 minutes',
            'The complete problem statement will not be provided.',
            'Any programming language may be used.',
            'Shortlisting for Round 2 will be based on Round 1 performance.',
            'Final results will be based on overall performance.',
            'Any form of malpractice will lead to immediate disqualification.'
        ],
        instructions: [
            'Participants can bring their own laptops and chargers.',
            'Programs must generate the exact expected output.'
        ],
        price: 'FREE',
        quote: 'Decode the outcome. Rebuild the logic.'
    },
    {
        id: 'sip-to-survive',
        name: 'Sip to Survive',
        subtitle: 'Mark Is Testing',
        icon: FaCoffee,
        color: '#97b85d',
        teamSize: '2-3',
        heads: 'Maneesh (90251 12972), Anand (73583 10946)',
        teamMembers: [
            'Maneesh - 90251 12972',
            'Anand - 73583 10946',
            'Karthik v - 8838581619',
            'Meghaaa - 93636 38134',
            'Shreenidhi - 6374978872'
        ],
        whatIsThisEventAbout: 'A Fast-paced technical endurance challenge where teams solve continuous coding, debugging, and logic-based tasks while handling intentional distractions through interval-based beverage consumption.',
        rules: [
            'A team may consist of 2-3 members',
            'The teams are provided with a set of tasks at the beginning of a round.',
            'The teams are to solve the maximum number of tasks given within the given time provided',
            'Along with the completion of tasks, the teams are expected to consume provided beverages (such as lemon extract, ginger shot ,. etc) at regular time intervals before continuing their tasks',
            'Special privileges are provided in between tasks that enable the teams to complete tasks faster or avoid beverage consumption.',
            'The team that gains the most number of points by completing the tasks will be announced the winner'
        ],
        instructions: [
            'Teams are to bring their own laptops for the event.',
            'Participants may use AI tools that are only suggested by the event organizers',
            'Tasks can be expected to be from producing output of a code snippet, writing programs for a problem, debugging code, up to creating simple webpages (only HTML, CSS, JS involved)'
        ],
        price: 'FREE',
        quote: 'Test the test. Break the rules.'
    },
    {
        id: 'codecrypt',
        name: 'CodeCrypt',
        subtitle: 'Snippet Clues',
        icon: FaPuzzlePiece,
        color: '#ffa500',
        teamSize: '1-2',
        heads: 'Diya Akshita (63691 53979), Sangeetha B (89255 30515)',
        teamMembers: [
            'Diya Akshita - 63691 53979',
            'Sangeetha B - 89255 30515',
            'Pawan Eswaran - 90258 16772',
            'Aarya - 72006 11307'
        ],
        whatIsThisEventAbout: 'CodeCrypt is a technical puzzle-based coding event where participants analyze code snippets to uncover hidden clues. Instead of writing programs, teams must understand, interpret, and decode given code under time pressure. The event progresses through multiple rounds, each increasing in difficulty, testing participants\' programming fundamentals, logical reasoning, and problem-solving skills. It is designed to challenge how well participants can think through code, predict outputs, identify patterns, and make strategic decisions while racing against time.',
        rules: [
            'Teams must use only the code snippets provided',
            'Each round consists of code snippets that hide clues',
            'Analyze the code carefully and submit the correct clue within the given time',
            'Wrong answers and hints (where allowed) will add time penalties',
            'All required questions in a round must be solved to advance',
            'Final rankings are based on total time taken, including penalties'
        ],
        instructions: [
            'Participants must bring their own laptops and chargers',
            'Any violation of the rules will result in immediate disqualification'
        ],
        price: 'FREE',
        quote: 'Every clue compiles a truth.'
    },
    {
        id: 'linklogic',
        name: 'LinkLogic',
        subtitle: 'Connections',
        icon: FaProjectDiagram,
        color: '#e33e33',
        teamSize: '2',
        heads: 'Shreyas Manivannan (94980 73776), Muthaiah Pandi RP (85318 19732)',
        teamMembers: [
            'SHREYAS MANIVANNAN - 9498073776',
            'MUTHAIAH PANDI RP - 8531819732',
            'JOEL NIRUBAN ISAAC - 7200920486',
            'BHAVANA - 7339516814'
        ],
        whatIsThisEventAbout: 'A multi-round technical linking challenge designed to test your analytical thinking, pattern recognition, and speed. Teams must race against the clock to identify hidden relationships between technical terms, concepts, and code elements. As you progress from basic connections to complex cross-domain logic, you will need to rely solely on your knowledge to find the missing links.',
        rules: [
            'Each team must consist of exactly 2 members.',
            'Round 1 consists of 20 minutes where teams identify direct relationships between terms, symbols, and basic technical terms.',
            'Round 2 consists of 20 minutes where teams map indirect connections between algorithms, APIs, or outputs.',
            'Round 3 consists of 30 minutes where teams solve abstract, cross-domain logical links.',
            'Teams must rely entirely on their own knowledge and the clues provided.',
            'Incorrect answers and requesting hints (available in Round 3) will incur time or scoring penalties.',
            'Only teams clearing the current round will advance to the next.',
            'Strictly no AI tools or Internet usage allowed.'
        ],
        instructions: [
            'Teams must bring their own laptop and chargers.',
            'Judges\' decisions are final.',
            'Any rule violation leads to disqualification.',
            'Participants must use exclusively the tools authorized by the organisation.'
        ],
        price: 'FREE',
        quote: 'Connect the dots. Crack the logic.'
    },
    {
        id: 'pitchfest',
        name: 'Pitchfest',
        subtitle: 'Business Pitch',
        icon: FaLightbulb,
        color: '#97b85d',
        teamSize: '1-4',
        heads: 'Puvaneshwari K (97910 33668), Sivadarshan (93615 35161)',
        teamMembers: [
            'Puvaneshwari K - 9791033668',
            'Sivadarshan - 93615 35161',
            'Pragadeesh - 88255 44140',
            'Sam Francis - 9600855057'
        ],
        whatIsThisEventAbout: 'On-the-spot problem statements will be given to the players, who must create a business model with a proper revenue model and strategy, and pitch the business model to the judge.',
        rules: [
            'Team size: 1-4 members',
            'Model Development Time: 20 minutes',
            'Pitch Time: 3 minutes',
            'Q&A: 2 minutes',
            'Pitch Method: No PPT use, only charts/sketches / templates provided by organizers',
            'All the necessary items will be provided by the organisers.',
            'No usage of mobile phones or laptops during the competition.',
            'No usage of AI or other resources during competition.',
            'No discussion with other team members.'
        ],
        instructions: [
            'Teams will be ranked primarily based on the accuracy of their solutions.',
            'In case of a tie, the total time taken will be used as the secondary ranking factor.',
            'Time penalties will be applied for the use of hints or assistance',
            'Final rankings will be calculated after applying all penalties.',
            'The top-ranked teams based on the final leaderboard will be declared as winners.'
        ],
        price: 'FREE',
        quote: 'Where ideas ignite opportunity.'
    }
];

export const paperPresentation = [
    {
        id: 'paper-presentation',
        name: 'Paper Presentation',
        subtitle: 'Innovation',
        icon: FaScroll,
        color: '#ffa500',
        teamSize: '1-3',
        heads: 'Gokul D (93455 41273)',
        whatIsThisEventAbout: 'A platform to showcase innovative ideas and technical research. Participants present their papers on trending technologies.',
        rules: [
            'Team: 1-3 members',
            'Submit abstract before deadline',
            'Presentation: 7 mins + Q&A: 3 mins',
            'Judges\' decision is final'
        ],
        price: '₹120',
        quote: 'Present. Publish. Prevail.'
    }
];

export const workshops = [
    {
        id: 'fintech-workshop',
        name: 'FinTech 360°',
        subtitle: 'Finance Meets Technology',
        icon: FaWrench,
        color: '#e33e33',
        teamSize: 'Individual/Team',
        heads: 'Priyanka L Sharma (63854 94091), P T Manisha (95081 47649)',
        teamMembers: [
            'Priyanka L Sharma - 6385494091',
            'P T Manisha - 95081 47649',
            'Gayathri R - 861 077 0289'
        ],
        whatIsThisEventAbout: 'FinTech 360° is a beginner-friendly, interactive workshop designed to give students a complete, practical view of the FinTech ecosystem—from digital payments and AI-driven decision systems to cybersecurity and regulations. Instead of only theory, this workshop focuses on how real-world FinTech systems actually work, using simulations, team challenges and hands-on activities. Participants will understand the technology behind UPI, fraud detection, loan approvals, blockchain, and modern financial platforms, along with career pathways in the FinTech industry. No prior experience is required—just curiosity and willingness to participate.',
        workshopFocusAreas: [
            'FinTech Fundamentals',
            'Digital Payments & UPI Architecture',
            'FinTech Architecture & Cloud Systems',
            'Cybersecurity & Fraud Detection in FinTech',
            'AI in Finance',
            'Blockchain, Crypto & Digital Assets',
            'FinTech Regulations & Ethics',
            'Careers & Startup Opportunities in FinTech'
        ],
        workshopFormat: {
            duration: '1.5 Hours (3 sets)',
            mode: 'Interactive, activity-driven & discussion-based',
            participation: 'Individual/ Team-based'
        },
        activities: [
            'Fraud or Not',
            'Buzzword Relay',
            'Loan Approval Simulation',
            'FinTech Quiz'
        ],
        instructions: [
            'Participants are encouraged to arrive on time.',
            'Listen carefully to instructions before each activity.',
            'No prior FinTech or coding knowledge is required.',
            'Bring curiosity, enthusiasm, and an open mind.'
        ],
        price: '₹100',
        quote: 'Finance meets innovation.'
    },
    {
        id: 'wealthx-workshop',
        name: 'WealthX',
        subtitle: 'Personal Finance & Investing',
        icon: FaWrench,
        color: '#97b85d',
        teamSize: 'Individual/Team',
        heads: 'Poonggundraan S (70106 25181), Haroon (93619 92667)',
        teamMembers: [
            'POONGGUNDRAAN S – 7010625181',
            'HAROON – 9361992667'
        ],
        whatIsThisEventAbout: 'WealthX is a beginner-friendly, interactive workshop designed to help students build a strong foundation in personal finance and investing. The workshop focuses on real-life money decisions—how to manage income, control expenses, save effectively, and understand investments—rather than just theory. Through activities, simulations, and discussions, participants will learn how wealth is built over time, the importance of financial discipline, and how to make smarter financial choices from an early stage. This session aims to create financial awareness, develop a wealth-building mindset, and help students understand how everyday financial decisions impact their future. No prior finance or investment knowledge is required.',
        workshopFocusAreas: [
            'Personal Finance Fundamentals',
            'Income, Expenses & Budgeting',
            'Savings & Emergency Planning',
            'Basics of Investing & Wealth Creation',
            'Risk vs Reward Understanding',
            'Financial Discipline & Long-Term Thinking',
            'Common Financial Mistakes to Avoid'
        ],
        workshopFormat: {
            duration: '2 Hours',
            mode: 'Interactive, activity-driven & discussion-based',
            participation: 'Individual & Team-based'
        },
        activities: [
            'Budget Planning Challenge',
            'Real-Life Financial Decision Scenarios',
            'Investment Basics Simulation',
            'WealthX Quiz'
        ],
        instructions: [
            'Participants are encouraged to arrive on time',
            'Listen carefully to instructions before each activity',
            'No prior finance or investment knowledge is required',
            'Participants must bring a laptop.'
        ],
        price: '₹100',
        quote: 'Build wealth. Build your future.'
    }
];