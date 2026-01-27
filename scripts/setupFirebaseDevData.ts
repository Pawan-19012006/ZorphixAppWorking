/**
 * Development Setup Script for Firebase
 * 
 * Creates event-to-admin mappings in Firestore with passwords.
 * 
 * Password pattern: <event_name>@zorphix@2026
 * (spaces removed, lowercase)
 * 
 * Run this script:
 * npx ts-node --skipProject scripts/setupFirebaseDevData.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import 'dotenv/config';

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

// Generate password from event name
// Pattern: <event_name>@zorphix@2026 (lowercase, no spaces)
function generatePassword(eventName: string): string {
    const cleaned = eventName.toLowerCase().replace(/\s+/g, '').replace(/°/g, '');
    return `${cleaned}@zorphix@2026`;
}

// Event admin mappings
const EVENT_ADMINS = [
    // Technical Events
    { email: 'pixelreforge@zorphix.com', eventName: 'Pixel Reforge' },
    { email: 'promptcraft@zorphix.com', eventName: 'PromptCraft' },
    { email: 'algopulse@zorphix.com', eventName: 'AlgoPulse' },
    { email: 'reversecoding@zorphix.com', eventName: 'Reverse Coding' },
    { email: 'siptosurvive@zorphix.com', eventName: 'Sip to Survive' },
    { email: 'codecrypt@zorphix.com', eventName: 'CodeCrypt' },
    { email: 'linklogic@zorphix.com', eventName: 'LinkLogic' },
    { email: 'pitchfest@zorphix.com', eventName: 'Pitchfest' },

    // Paper Presentation
    { email: 'paperpresentation@zorphix.com', eventName: 'Paper Presentation' },

    // Workshops
    { email: 'fintech@zorphix.com', eventName: 'FinTech 360°' },
    { email: 'wealthx@zorphix.com', eventName: 'WealthX' },

    // Master Admin
    { email: 'admin@zorphix.com', eventName: 'Admin' },
];

async function createEventAdminMappings() {
    // console.log('\n🚀 Creating Event Admin Mappings in Firestore...\n');
    // console.log('='.repeat(60));

    let successCount = 0;

    for (const admin of EVENT_ADMINS) {
        try {
            const password = generatePassword(admin.eventName);
            const docId = admin.email.replace(/[@.]/g, '_');

            await setDoc(doc(db, 'event_admins', docId), {
                email: admin.email.toLowerCase(),
                eventName: admin.eventName,
                password: password,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // console.log(`✅ ${admin.email}`);
            // console.log(`   Event: ${admin.eventName}`);
            // console.log(`   Password: ${password}`);
            // console.log('');
            successCount++;
        } catch (error: any) {
            console.error(`❌ Failed: ${admin.email} - ${error.message}`);
        }
    }

    // console.log('='.repeat(60));
    // console.log(`\n✨ Firestore Setup Complete! Created ${successCount}/${EVENT_ADMINS.length} mappings`);
}

// Print summary table
function printCredentialsSummary() {
    // console.log('\n📋 CREDENTIALS SUMMARY');
    // console.log('='.repeat(60));
    // console.log('');
    // console.log('Email'.padEnd(35) + 'Password');
    // console.log('-'.repeat(60));

    for (const admin of EVENT_ADMINS) {
        const password = generatePassword(admin.eventName);
        // console.log(`${admin.email.padEnd(35)} ${password}`);
    }

    // console.log('');
    // console.log('⚠️  Create these users in Firebase Console → Authentication');
    // console.log('');
}

// Verify existing data
async function verifyData() {
    // console.log('\n📊 Verifying Firestore data...\n');

    try {
        const snapshot = await getDocs(collection(db, 'event_admins'));
        // console.log(`Found ${snapshot.size} event admin mappings:\n`);

        snapshot.forEach(doc => {
            const data = doc.data();
            // console.log(`  ${data.email} -> ${data.eventName} (pwd: ${data.password})`);
        });
    } catch (error: any) {
        // console.error('Error reading data:', error.message);
    }
}

// Run
async function main() {
    await createEventAdminMappings();
    printCredentialsSummary();
    await verifyData();
    process.exit(0);
}

main().catch(err => {
    // console.error('Script failed:', err);

    process.exit(1);
});
