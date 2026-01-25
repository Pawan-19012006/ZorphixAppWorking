/**
 * Sample Data Setup Script for Firebase
 * 
 * Creates sample registrations and queries in Firestore for testing.
 * Uses Firestore auto-generated document IDs.
 * 
 * Run this script:
 * npx ts-node --skipProject scripts/setupSampleData.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDu5oRJbf-gWqDZzMOK6HYmb0PBLXNqFEo",
    authDomain: "zorphix-8d91e.firebaseapp.com",
    projectId: "zorphix-8d91e",
    storageBucket: "zorphix-8d91e.firebasestorage.app",
    messagingSenderId: "1016587815374",
    appId: "1:1016587815374:web:4972ea556e5e781aaac39f",
    measurementId: "G-PK6GESKCSB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample registrations (participants who registered via web)
// Structure matches actual Firebase data
const SAMPLE_REGISTRATIONS = [
    {
        displayName: 'Rahul Kumar',
        email: 'rahul.kumar@gmail.com',
        photoURL: '',
        name: 'Rahul Kumar',
        college: 'Chennai Institute of Technology',
        collegeOther: '',
        degree: 'B.Tech',
        degreeOther: '',
        department: 'Computer Science and Engineering',
        departmentOther: '',
        year: '3',
        phone: '9876543210',
        events: ['Pixel Reforge', 'AlgoPulse', 'FinTech 360°'],
        payments: [
            {
                orderId: 'order_test_001',
                paymentId: 'pay_test_001',
                eventNames: ['FinTech 360°'],
                amount: 100,
                timestamp: Timestamp.now(),
                verified: true
            }
        ],
        registeredAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profileCompleted: true,
        portfolioValue: 'PENDING VALUATION'
    },
    {
        displayName: 'Priya Sharma',
        email: 'priya.sharma@gmail.com',
        photoURL: '',
        name: 'Priya Sharma',
        college: 'Anna University',
        collegeOther: '',
        degree: 'B.E',
        degreeOther: '',
        department: 'Information Technology',
        departmentOther: '',
        year: '2',
        phone: '9123456780',
        events: ['PromptCraft', 'CodeCrypt', 'WealthX'],
        payments: [
            {
                orderId: 'order_test_002',
                paymentId: 'pay_test_002',
                eventNames: ['WealthX'],
                amount: 100,
                timestamp: Timestamp.now(),
                verified: true
            }
        ],
        registeredAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profileCompleted: true,
        portfolioValue: 'PENDING VALUATION'
    },
    {
        displayName: 'Arun Venkat',
        email: 'arun.venkat@gmail.com',
        photoURL: '',
        name: 'Arun Venkat',
        college: 'SRM Institute of Science and Technology',
        collegeOther: '',
        degree: 'B.Tech',
        degreeOther: '',
        department: 'Artificial Intelligence and Data Science',
        departmentOther: '',
        year: '4',
        phone: '9988776655',
        events: ['Reverse Coding', 'LinkLogic', 'Paper Presentation'],
        payments: [
            {
                orderId: 'order_test_003',
                paymentId: 'pay_test_003',
                eventNames: ['Paper Presentation'],
                amount: 120,
                timestamp: Timestamp.now(),
                verified: true
            }
        ],
        registeredAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profileCompleted: true,
        portfolioValue: 'PENDING VALUATION'
    },
    {
        displayName: 'Divya Lakshmi',
        email: 'divya.l@gmail.com',
        photoURL: '',
        name: 'Divya Lakshmi',
        college: 'VIT Chennai',
        collegeOther: '',
        degree: 'M.Tech',
        degreeOther: '',
        department: 'Cyber Security',
        departmentOther: '',
        year: '1',
        phone: '8877665544',
        events: ['Sip to Survive', 'Pitchfest'],
        payments: [],
        registeredAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profileCompleted: true,
        portfolioValue: 'PENDING VALUATION'
    },
    {
        displayName: 'Karthik Rajan',
        email: 'karthik.r@gmail.com',
        photoURL: '',
        name: 'Karthik Rajan',
        college: 'PSG College of Technology',
        collegeOther: '',
        degree: 'B.E',
        degreeOther: '',
        department: 'Electronics and Communication Engineering',
        departmentOther: '',
        year: '3',
        phone: '7766554433',
        events: ['AlgoPulse', 'Pixel Reforge', 'FinTech 360°', 'WealthX'],
        payments: [
            {
                orderId: 'order_test_005a',
                paymentId: 'pay_test_005a',
                eventNames: ['FinTech 360°', 'WealthX'],
                amount: 200,
                timestamp: Timestamp.now(),
                verified: true
            }
        ],
        registeredAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profileCompleted: true,
        portfolioValue: 'PENDING VALUATION'
    },
    // Unpaid registration example - for testing payment verification
    {
        displayName: 'Sneha Menon',
        email: 'sneha.m@gmail.com',
        photoURL: '',
        name: 'Sneha Menon',
        college: 'Chennai Institute of Technology',
        collegeOther: '',
        degree: 'B.Tech',
        degreeOther: '',
        department: 'Computer Science and Engineering',
        departmentOther: '',
        year: '2',
        phone: '6655443322',
        events: ['CodeCrypt', 'Paper Presentation'],
        payments: [], // Not paid for Paper Presentation - will fail verification!
        registeredAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profileCompleted: true,
        portfolioValue: 'PENDING VALUATION'
    }
];

// Sample queries
const SAMPLE_QUERIES = [
    {
        email: 'student1@gmail.com',
        name: 'Sample Student',
        userId: null,
        message: 'How can I register for multiple events at once?',
        status: 'pending',
        response: '',
        createdAt: Timestamp.now(),
        respondedAt: null,
        respondedBy: ''
    },
    {
        email: 'user.test@gmail.com',
        name: 'Test User',
        userId: null,
        message: 'I paid for FinTech workshop but it shows pending. Please help.',
        status: 'responded',
        response: 'Your payment has been verified. You are now registered for FinTech 360°.',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
        respondedAt: Timestamp.now(),
        respondedBy: 'admin'
    }
];

async function createRegistrations() {
    // console.log('\n📝 Creating Sample Registrations...\n');
    // console.log('   (Using Firestore auto-generated UIDs)\n');

    const createdUsers: { uid: string; name: string; events: string[] }[] = [];

    for (const reg of SAMPLE_REGISTRATIONS) {
        try {
            // Let Firestore auto-generate the document ID (uid)
            const docRef = await addDoc(collection(db, 'registrations'), reg);

            // Update the document to include the uid field
            await setDoc(docRef, { uid: docRef.id }, { merge: true });

            // console.log(`✅ Created: ${reg.name}`);
            // console.log(`   UID: ${docRef.id}`);
            // console.log(`   Events: ${reg.events.join(', ')}`);
            // console.log('');

            createdUsers.push({
                uid: docRef.id,
                name: reg.name,
                events: reg.events
            });
        } catch (error: any) {
            // console.error(`❌ Failed: ${reg.name} - ${error.message}`);
        }
    }

    return createdUsers;
}

async function createQueries() {
    // console.log('\n❓ Creating Sample Queries...\n');

    let count = 0;
    for (const query of SAMPLE_QUERIES) {
        try {
            const docRef = await addDoc(collection(db, 'queries'), query);
            // console.log(`✅ Created query from: ${query.name} (${docRef.id})`);
            count++;
        } catch (error: any) {
            console.error(`❌ Failed: ${query.email} - ${error.message}`);
        }
    }
    // console.log(`\n   Created ${count}/${SAMPLE_QUERIES.length} queries`);
}

async function main() {
    // console.log('\n🚀 Setting Up Sample Data for Zorphix...\n');
    // console.log('='.repeat(60));

    const users = await createRegistrations();
    await createQueries();

    // console.log('\n' + '='.repeat(60));
    // console.log('\n✨ Sample Data Setup Complete!\n');
    // console.log('📋 Created:');
    // console.log(`   - ${users.length} sample registrations`);
    // console.log(`   - ${SAMPLE_QUERIES.length} sample queries`);

    // console.log('\n🔑 Test UIDs for QR scanning:');
    // console.log('   (Use these in your QR code scanner app)\n');
    users.forEach(u => {
        // console.log(`   ${u.uid}`);
        // console.log(`   └─ ${u.name} (${u.events.join(', ')})\n`);
    });

    // console.log('💡 TIP: Save these UIDs to create QR codes for testing!');
    // console.log('');

    process.exit(0);
}

main().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
