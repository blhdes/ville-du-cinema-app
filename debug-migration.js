/**
 * Debug script for MigrationModal
 * Run this in browser console to diagnose issues
 *
 * Usage:
 * 1. Open DevTools Console
 * 2. Copy and paste this entire script
 * 3. Run: debugMigration.report()
 */

const debugMigration = {
    LOCALFORAGE_KEY: 'followed_users',
    SESSION_KEY: 'migration_modal_dismissed',

    async checkLocalforage() {
        try {
            // localforage should be available globally in the app
            const data = await localforage.getItem(this.LOCALFORAGE_KEY);
            return {
                exists: data !== null,
                data: data,
                count: Array.isArray(data) ? data.length : 0
            };
        } catch (e) {
            return { error: e.message };
        }
    },

    checkSessionStorage() {
        const dismissed = sessionStorage.getItem(this.SESSION_KEY);
        return {
            dismissed: dismissed !== null,
            value: dismissed
        };
    },

    clearSessionStorage() {
        sessionStorage.removeItem(this.SESSION_KEY);
        console.log('✅ Session storage cleared');
    },

    async setTestData(usernames = ['testuser1', 'testuser2']) {
        try {
            await localforage.setItem(this.LOCALFORAGE_KEY, usernames);
            console.log('✅ Test data set:', usernames);
        } catch (e) {
            console.error('❌ Failed to set test data:', e);
        }
    },

    async clearLocalforage() {
        try {
            await localforage.removeItem(this.LOCALFORAGE_KEY);
            console.log('✅ Localforage cleared');
        } catch (e) {
            console.error('❌ Failed to clear localforage:', e);
        }
    },

    async report() {
        console.log('=== Migration Modal Debug Report ===\n');

        // Check localforage
        const lfResult = await this.checkLocalforage();
        console.log('📦 Localforage (followed_users):');
        if (lfResult.error) {
            console.log('   ❌ Error:', lfResult.error);
        } else if (lfResult.exists) {
            console.log('   ✅ Has data:', lfResult.count, 'users');
            console.log('   📝 Users:', lfResult.data);
        } else {
            console.log('   ⚠️ No data (empty or null)');
        }

        // Check session storage
        const ssResult = this.checkSessionStorage();
        console.log('\n🔒 SessionStorage (dismissed flag):');
        if (ssResult.dismissed) {
            console.log('   ⚠️ Modal was dismissed this session');
            console.log('   💡 Run: debugMigration.clearSessionStorage()');
        } else {
            console.log('   ✅ Not dismissed');
        }

        // Summary
        console.log('\n📋 Summary:');
        const shouldShow = lfResult.exists && lfResult.count > 0 && !ssResult.dismissed;
        if (shouldShow) {
            console.log('   ✅ Modal SHOULD show on next login transition');
        } else {
            console.log('   ❌ Modal will NOT show because:');
            if (!lfResult.exists || lfResult.count === 0) {
                console.log('      - No local data to migrate');
                console.log('      💡 Run: debugMigration.setTestData()');
            }
            if (ssResult.dismissed) {
                console.log('      - Already dismissed this session');
                console.log('      💡 Run: debugMigration.clearSessionStorage()');
            }
        }

        console.log('\n🔧 Available commands:');
        console.log('   debugMigration.setTestData()     - Add test users to localforage');
        console.log('   debugMigration.clearSessionStorage() - Clear dismiss flag');
        console.log('   debugMigration.clearLocalforage() - Clear local users');
        console.log('   debugMigration.fullReset()       - Reset everything for fresh test');

        return { localforage: lfResult, sessionStorage: ssResult, shouldShow };
    },

    async fullReset() {
        this.clearSessionStorage();
        await this.setTestData(['mubi', 'davidehrlich', 'letterboxd']);
        console.log('\n✅ Full reset complete. Now:');
        console.log('   1. Make sure you are LOGGED OUT');
        console.log('   2. Verify local users appear in UI');
        console.log('   3. Login - modal should appear');
    }
};

// Auto-run report
debugMigration.report();
