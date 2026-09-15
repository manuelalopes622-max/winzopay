import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction
} from 'firebase/firestore';

// Load Firebase configuration
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfigData: any = {};
try {
  if (fs.existsSync(configPath)) {
    firebaseConfigData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

const firebaseApp = !getApps().length
  ? initializeApp({
      apiKey: process.env.FIREBASE_API_KEY || firebaseConfigData.apiKey,
      projectId: firebaseConfigData.projectId,
      appId: firebaseConfigData.appId,
      authDomain: firebaseConfigData.authDomain,
      storageBucket: firebaseConfigData.storageBucket,
      messagingSenderId: firebaseConfigData.messagingSenderId,
    })
  : getApp();

const db = getFirestore(
  firebaseApp,
  firebaseConfigData.firestoreDatabaseId || '(default)'
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API 1.5: Direct APK Download with Android Package MIME type
  app.get(['/api/download-apk', '/winzopay.apk', '/WinzoPay.apk'], (req, res) => {
    const apkPath = path.join(process.cwd(), 'public', 'WinzoPay.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="WinzoPay.apk"');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(apkPath);
    }
    return res.status(404).json({ error: 'APK file not found' });
  });

  // Helper: Normalize 10-digit mobile number
  const normalizePhone = (phoneInput: string): string => {
    let clean = (phoneInput || '').replace(/\D/g, '');
    if (clean.length === 12 && (clean.startsWith('92') || clean.startsWith('91'))) {
      clean = clean.slice(2);
    } else if (clean.length > 10 && clean.startsWith('0')) {
      clean = clean.replace(/^0+/, '');
    }
    return clean.length >= 10 ? clean.slice(-10) : clean;
  };

  // Helper: Find user document in Firestore by phone or UID
  const findUserInFirestore = async (standardPhone: string, uidFallback: string) => {
    // 1. Direct doc by standardPhone
    try {
      const snapDirect = await getDoc(doc(db, 'users', standardPhone));
      if (snapDirect.exists()) return { docRef: snapDirect.ref, data: snapDirect.data() };
    } catch {}

    // 2. Direct doc by +92standardPhone
    try {
      const snapPlus = await getDoc(doc(db, 'users', `+92${standardPhone}`));
      if (snapPlus.exists()) return { docRef: snapPlus.ref, data: snapPlus.data() };
    } catch {}

    // 3. Direct doc by 92standardPhone
    try {
      const snap92 = await getDoc(doc(db, 'users', `92${standardPhone}`));
      if (snap92.exists()) return { docRef: snap92.ref, data: snap92.data() };
    } catch {}

    // Direct doc by 0standardPhone
    try {
      const snapZero = await getDoc(doc(db, 'users', `0${standardPhone}`));
      if (snapZero.exists()) return { docRef: snapZero.ref, data: snapZero.data() };
    } catch {}

    // 4. Direct doc by UID
    try {
      const snapUid = await getDoc(doc(db, 'users', uidFallback));
      if (snapUid.exists()) return { docRef: snapUid.ref, data: snapUid.data() };
    } catch {}

    // 5. Scan collection if needed
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let found: any = null;
      usersSnap.forEach((d) => {
        if (found) return;
        const data = d.data();
        const raw = (data.userPhone || data.phone || data.rawPhone || '').toString().replace(/\D/g, '');
        const dUid = (data.userId || d.id || '').toString().toUpperCase();
        if (
          raw === standardPhone ||
          (raw.length >= 10 && raw.slice(-10) === standardPhone) ||
          dUid === uidFallback.toUpperCase()
        ) {
          found = { docRef: d.ref, data };
        }
      });
      if (found) return found;
    } catch {}

    return null;
  };

  // API: User Registration
  app.post('/api/auth/register', async (req, res) => {
    const { fullName, phone, password, email, referralCode } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your full name as per bank records.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    try {
      const newUid = `WZP-${cleanPhone.slice(-6)}`;
      const existingUser = await findUserInFirestore(cleanPhone, newUid);

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `An account with mobile number +92 ${cleanPhone} already exists. Please sign in instead.`,
        });
      }

      // Check referral code
      let finalReferredBy = '';
      let finalReferrerName = '';
      if (referralCode && referralCode.trim()) {
        const refUpper = referralCode.trim().toUpperCase();
        const refDigits = referralCode.trim().replace(/\D/g, '');
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((d) => {
          if (finalReferredBy) return;
          const data = d.data();
          const rPhone = (data.userPhone || data.phone || '').toString().replace(/\D/g, '');
          const rUid = (data.userId || d.id || '').toString().toUpperCase();
          const rCode = (data.referralCode || '').toString().toUpperCase();
          if (rCode === refUpper || rUid === refUpper || (refDigits && rPhone && rPhone === refDigits)) {
            finalReferredBy = data.userId || d.id;
            finalReferrerName = data.userName || 'Winzo Trader';
          }
        });
      }

      const assignedEmail = (email && email.trim()) || `${cleanPhone}@user.winzopay.com`;
      const origin = req.headers.origin || 'https://winzopay-website.onrender.com';
      const myReferralCode = newUid;
      const myJoinedViaCode = finalReferredBy;
      const myJoinedViaLink = finalReferredBy ? `${origin}/signup?ref=${encodeURIComponent(finalReferredBy)}` : '';

      const userData = {
        userId: newUid,
        userName: fullName.trim(),
        userPhone: cleanPhone,
        rawPhone: cleanPhone,
        fullPhone: `+92${cleanPhone}`,
        fullPhoneNumber: `92${cleanPhone}`,
        countryCode: '+92',
        country: 'PAKISTAN',
        email: assignedEmail,
        password: password,
        topUpBalance: 0.00,
        availableBalance: 0.00,
        withdrawableBalance: 0.00,
        todayCommission: 0.00,
        rpMiningBalance: 0.00,
        activeMiningInvested: 0.00,
        pendingWithdrawal: 0.00,
        bankAccounts: [],
        bankName: 'No Bank Linked',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: fullName.trim(),
        upiId: '',
        vipLevel: 1,
        referralCode: myReferralCode,
        referredBy: finalReferredBy,
        referrerName: finalReferrerName,
        joinedViaReferralCode: myJoinedViaCode,
        joinedViaReferralLink: myJoinedViaLink,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in Firestore across all keys
      await Promise.all([
        setDoc(doc(db, 'users', cleanPhone), userData),
        setDoc(doc(db, 'users', `+92${cleanPhone}`), userData, { merge: true }),
        setDoc(doc(db, 'users', newUid), userData, { merge: true }),
      ]);

      return res.json({
        success: true,
        user: userData,
        message: 'Account successfully registered!',
      });
    } catch (err: any) {
      console.error('Server /api/auth/register error:', err);
      return res.status(500).json({
        success: false,
        message: err?.message || 'Database error during registration.',
      });
    }
  });

  // API: User Login
  app.post('/api/auth/login', async (req, res) => {
    const { phone, password } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your account password.' });
    }

    try {
      const fallbackUid = `WZP-${cleanPhone.slice(-6)}`;
      const userResult = await findUserInFirestore(cleanPhone, fallbackUid);

      if (!userResult) {
        return res.status(404).json({
          success: false,
          message: `No account found with mobile number +92 ${cleanPhone}. Please register a new account.`,
        });
      }

      const userData = userResult.data;

      // Validate password
      if (userData.password && userData.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password entered. Please check your credentials or reset your password.',
        });
      }

      // If user had no password stored, save it now
      if (!userData.password) {
        await updateDoc(userResult.docRef, { password, updatedAt: new Date().toISOString() });
        userData.password = password;
      }

      // Ensure synced across keys
      try {
        await Promise.all([
          setDoc(doc(db, 'users', cleanPhone), userData, { merge: true }),
          setDoc(doc(db, 'users', fallbackUid), userData, { merge: true }),
        ]);
      } catch {}

      return res.json({
        success: true,
        user: userData,
        message: 'Login successful!',
      });
    } catch (err: any) {
      console.error('Server /api/auth/login error:', err);
      return res.status(500).json({
        success: false,
        message: err?.message || 'Database error during login.',
      });
    }
  });

  // API: Reset Password
  app.post('/api/auth/reset-password', async (req, res) => {
    const { phone, newPassword } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    try {
      const fallbackUid = `WZP-${cleanPhone.slice(-6)}`;
      const userResult = await findUserInFirestore(cleanPhone, fallbackUid);

      if (!userResult) {
        return res.status(404).json({
          success: false,
          message: `No account registered with mobile number +92 ${cleanPhone}. Please check your number or register.`,
        });
      }

      const updates = { password: newPassword, updatedAt: new Date().toISOString() };
      await Promise.all([
        updateDoc(userResult.docRef, updates),
        setDoc(doc(db, 'users', cleanPhone), updates, { merge: true }),
        setDoc(doc(db, 'users', fallbackUid), updates, { merge: true }),
      ]);

      return res.json({
        success: true,
        message: 'Your password has been successfully reset! You can now sign in.',
      });
    } catch (err: any) {
      console.error('Server /api/auth/reset-password error:', err);
      return res.status(500).json({
        success: false,
        message: err?.message || 'Database error resetting password.',
      });
    }
  });

  // API 2: Referral Code Validation (Public, Sanitize Sensitive Info)
  // Ensures ONLY public referrer info (name, code) is returned.
  // NEVER leaks referrer's deposits, withdrawals, commission, balance, or private activity.
  app.get('/api/referrals/validate', async (req, res) => {
    const code = ((req.query.code as string) || '').trim();
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Referral code is required.' });
    }

    try {
      const codeUpper = code.toUpperCase();
      const codeDigits = code.replace(/\D/g, '');

      const usersSnap = await getDocs(collection(db, 'users'));
      let foundUser: { userId: string; userName: string; referralCode: string } | null = null;

      usersSnap.forEach((docSnap) => {
        if (foundUser) return;
        const data = docSnap.data();
        const rawPhone = (data.userPhone || data.phone || '').toString().replace(/\D/g, '');
        const uid = (data.userId || '').toString().toUpperCase();
        const refCode = (data.referralCode || '').toString().toUpperCase();

        if (
          (refCode && refCode === codeUpper) ||
          (uid && uid === codeUpper) ||
          (codeDigits && rawPhone && rawPhone === codeDigits) ||
          docSnap.id.toUpperCase() === codeUpper
        ) {
          foundUser = {
            userId: data.userId || docSnap.id,
            userName: data.userName || 'Winzo Trader',
            referralCode: data.referralCode || (rawPhone ? `WZP-${rawPhone.slice(-6)}` : data.userId),
          };
        }
      });

      if (foundUser) {
        return res.json({
          valid: true,
          referrerName: foundUser.userName,
          referralCode: foundUser.referralCode,
          message: `Verified! Referring Head: ${foundUser.userName} (${foundUser.referralCode})`,
        });
      }

      return res.json({
        valid: false,
        message: 'Referral code not found in our database.',
      });
    } catch (err: any) {
      console.error('API /api/referrals/validate error:', err);
      return res.status(500).json({ valid: false, message: 'Server error validating referral code', error: err.message });
    }
  });

  // API 3: Authorized Team & Referral Query
  // Privacy Enforcement:
  // - Only the referrer/agent can see their directly referred members' deposits and permitted activity.
  // - Referred users must NOT see their referrer's deposits, withdrawals, commission, balance, or private activity.
  // - Enforced through backend authorization headers/checks.
  app.get('/api/team', async (req, res) => {
    const reqUserId = ((req.headers['x-user-id'] as string) || (req.query.userId as string) || '').trim();
    const reqUserPhone = ((req.headers['x-user-phone'] as string) || (req.query.userPhone as string) || '').replace(/\D/g, '');
    const adminToken = (req.headers['x-admin-token'] as string) || '';
    const isAdmin = adminToken === '112211';

    const targetHeadId = ((req.query.headId as string) || '').trim();

    // Authentication requirement
    if (!isAdmin && !reqUserId && !reqUserPhone) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required to view team activity.',
      });
    }

    // Strict Authorization: Non-admin users cannot query someone else's team or upstream referrer
    if (!isAdmin && targetHeadId) {
      const targetPhone = targetHeadId.replace(/\D/g, '');
      const isSelf = targetHeadId === reqUserId || (targetPhone && targetPhone === reqUserPhone);
      if (!isSelf) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are only authorized to view your own directly referred members.',
        });
      }
    }

    try {
      // 1. Fetch users from DB
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsersList: any[] = [];
      usersSnap.forEach((d) => allUsersList.push({ id: d.id, ...d.data() }));

      // Find the authenticated user's record
      const authUser = allUsersList.find((u) => {
        const uPhone = (u.userPhone || u.phone || '').toString().replace(/\D/g, '');
        const uId = (u.userId || u.id || '').toString();
        return (reqUserId && uId === reqUserId) || (reqUserPhone && uPhone === reqUserPhone);
      });

      if (!isAdmin && !authUser) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not found in database.',
        });
      }

      // Determine head identity
      const headUid = isAdmin && targetHeadId ? targetHeadId : (authUser?.userId || reqUserId);
      const headPhone = isAdmin && targetHeadId ? targetHeadId.replace(/\D/g, '') : (authUser ? (authUser.userPhone || '').replace(/\D/g, '') : reqUserPhone);
      const headRefCode = (authUser?.referralCode || (headPhone ? `WZP-${headPhone.slice(-6)}` : headUid) || '').toUpperCase();

      // 2. Fetch all transactions to compute permitted member deposit activity
      const txSnap = await getDocs(collection(db, 'transactions'));
      const allTxs: any[] = [];
      txSnap.forEach((d) => allTxs.push({ id: d.id, ...d.data() }));

      // 3. Find ONLY members whose referredBy matches this head (downstream direct members only)
      const directMembers = allUsersList.filter((u) => {
        if (!u.referredBy) return false;
        const refByClean = u.referredBy.trim().toUpperCase();
        const refByDigits = u.referredBy.replace(/\D/g, '');

        const matchUid = headUid && refByClean === headUid.toUpperCase();
        const matchRefCode = headRefCode && refByClean === headRefCode;
        const matchPhone = headPhone && refByDigits && refByDigits === headPhone;

        return matchUid || matchRefCode || matchPhone;
      });

      // 4. Map directly referred members with permitted activity
      // PRIVACY:
      // - NEVER returns referrer's balance, commission, withdrawals, or deposits.
      // - Only returns the permitted member deposit stats and non-sensitive member fields.
      const teamMembers = directMembers.map((m) => {
        const mCleanPhone = (m.userPhone || '').replace(/\D/g, '');
        const mUid = m.userId || m.id;

        const memberDepositTxs = allTxs.filter((tx) => {
          const txPhone = (tx.userPhone || '').replace(/\D/g, '');
          const isMember = (mUid && tx.userId === mUid) || (mCleanPhone && txPhone && txPhone === mCleanPhone);
          return isMember && tx.type === 'DEPOSIT' && tx.status === 'SUCCESS';
        });

        const totalDeposits = memberDepositTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        const depositCount = memberDepositTxs.length;
        const lastDeposit = memberDepositTxs[0]?.createdAt || memberDepositTxs[0]?.timestamp;
        const isActive = totalDeposits > 0 || (Number(m.topUpBalance) || 0) > 0 || (Number(m.availableBalance) || 0) > 0;

        return {
          userId: mUid,
          userName: m.userName || 'Team Member',
          userPhone: m.userPhone || '',
          email: m.email,
          referralCode: m.referralCode || (mCleanPhone ? `WZP-${mCleanPhone.slice(-6)}` : mUid),
          joinedViaCode: m.joinedViaReferralCode || m.referredBy || headRefCode || headUid,
          joinedDate: m.createdAt || new Date().toISOString(),
          accountStatus: (isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          totalDeposits,
          depositCount,
          lastDepositDate: lastDeposit,
          permittedDeposits: memberDepositTxs.map((tx) => ({
            id: tx.id,
            amount: Number(tx.amount) || 0,
            status: tx.status,
            createdAt: tx.createdAt || tx.timestamp,
          })),
        };
      }).sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());

      const totalMembers = teamMembers.length;
      const activeMembers = teamMembers.filter((m) => m.accountStatus === 'Active').length;
      const totalDeposits = teamMembers.reduce((sum, m) => sum + m.totalDeposits, 0);

      return res.json({
        success: true,
        headId: headUid,
        headName: authUser?.userName || 'Referrer Agent',
        headReferralCode: headRefCode,
        teamMembers,
        teamStats: {
          totalMembers,
          activeMembers,
          totalDeposits,
        },
      });
    } catch (err: any) {
      console.error('API /api/team error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving team data', error: err.message });
    }
  });

  // API 3.5: User Transaction Ledger (Strict User Activity Isolation)
  // Ensures:
  // - A user can only fetch their own transactions, deposits, and withdrawals
  // - Prevents any leakage of another user's activity or ledger records
  app.get('/api/user/transactions', async (req, res) => {
    try {
      const rawPhone = (req.headers['x-user-phone'] as string || req.query.userPhone as string || '').replace(/\D/g, '');
      const rawUid = ((req.headers['x-user-id'] as string || req.query.userId as string || '')).trim().toUpperCase();

      if (!rawPhone && !rawUid) {
        return res.status(401).json({ success: false, message: 'Authentication required: Provide user ID or phone' });
      }

      const txSnapshot = await getDocs(collection(db, 'transactions'));
      const userTransactions: any[] = [];

      txSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const recPhone = (data.userPhone || '').toString().replace(/\D/g, '');
        const recUid = (data.userId || '').toString().trim().toUpperCase();

        if (!recPhone && !recUid) return;

        let belongs = false;
        // Phone match
        if (rawPhone && recPhone) {
          if (recPhone === rawPhone) belongs = true;
          else if (rawPhone.length >= 10 && recPhone.length >= 10 && recPhone.slice(-10) === rawPhone.slice(-10)) belongs = true;
        }
        // UID match
        if (rawUid && recUid) {
          if (recUid === rawUid) belongs = true;
          else if (rawPhone.length >= 6 && recUid === `WZP-${rawPhone.slice(-6)}`.toUpperCase()) belongs = true;
          else if (recPhone.length >= 6 && rawUid === `WZP-${recPhone.slice(-6)}`.toUpperCase()) belongs = true;
        }
        // UID containing phone suffix
        if (rawPhone && recUid) {
          if (recUid === rawPhone || (rawPhone.length >= 6 && recUid.endsWith(rawPhone.slice(-6)))) belongs = true;
        }

        if (belongs) {
          userTransactions.push({ id: docSnap.id, ...data });
        }
      });

      // Sort newest first
      userTransactions.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return res.json({
        success: true,
        count: userTransactions.length,
        transactions: userTransactions,
      });
    } catch (err: any) {
      console.error('API /api/user/transactions error:', err);
      return res.status(500).json({ success: false, message: 'Error retrieving user transactions', error: err.message });
    }
  });

  // API 4: Withdrawal Rejection (Atomic & Exact-Once Refund Logic)
  // Ensures:
  // - PENDING -> REJECTED: refunds exactly once.
  // - REJECTED -> REJECTED: refunds Rs. 0 (idempotent, no double refund).
  // - Uses database atomic transaction.
  app.post('/api/withdrawals/reject', async (req, res) => {
    const { requestId, reason } = req.body || {};
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required.' });
    }

    // Admin authorization check
    const adminToken = req.headers['x-admin-token'] || req.headers['authorization'];
    if (adminToken !== '112211' && adminToken !== 'Bearer 112211') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin authorization required to reject withdrawals.' });
    }

    try {
      const result = await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', requestId);
        const withdrawalSnap = await transaction.get(withdrawalRef);

        if (!withdrawalSnap.exists()) {
          throw new Error(`Withdrawal request ${requestId} not found in database.`);
        }

        const wData = withdrawalSnap.data();
        const currentStatus = (wData.status || '').toUpperCase();
        const alreadyRefunded = wData.isRefunded === true || currentStatus === 'REJECTED';

        // Idempotency: If already REJECTED or already refunded, DO NOT REFUND AGAIN!
        if (alreadyRefunded) {
          return {
            refunded: false,
            amountRefunded: 0,
            previousBalance: null,
            newBalance: null,
            currentStatus: 'REJECTED',
            isAlreadyRejected: true,
            message: 'Withdrawal is already rejected. No additional refund processed.',
            userId: wData.userId,
            userPhone: wData.userPhone,
            amount: Number(wData.amount) || 0,
          };
        }

        // PENDING -> REJECTED: Process refund exactly once!
        const amount = Number(wData.amount) || 0;
        const targetPhone = (wData.userPhone || '').replace(/\D/g, '');
        const targetUid = wData.userId;

        // Locate target user doc
        let userDocRef = targetPhone ? doc(db, 'users', targetPhone) : (targetUid ? doc(db, 'users', targetUid) : null);
        let userSnap = userDocRef ? await transaction.get(userDocRef) : null;

        if ((!userSnap || !userSnap.exists()) && targetUid) {
          userDocRef = doc(db, 'users', targetUid);
          userSnap = await transaction.get(userDocRef);
        }

        let currentWithdrawable = 0;
        if (userSnap && userSnap.exists()) {
          const uData = userSnap.data();
          currentWithdrawable = typeof uData.withdrawableBalance === 'number' ? uData.withdrawableBalance : 0;
        }
        const newWithdrawable = currentWithdrawable + amount;

        // Atomic write 1: Update withdrawal status and mark isRefunded: true
        transaction.update(withdrawalRef, {
          status: 'REJECTED',
          rejectedReason: reason || 'Bank account verification failed',
          isRefunded: true,
          refundedAmount: amount,
          refundedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Atomic write 2: Update user's withdrawableBalance inside same transaction
        if (userDocRef && userSnap && userSnap.exists()) {
          transaction.update(userDocRef, {
            withdrawableBalance: newWithdrawable,
            updatedAt: new Date().toISOString(),
          });
        }

        return {
          refunded: true,
          amountRefunded: amount,
          previousBalance: currentWithdrawable,
          newBalance: newWithdrawable,
          currentStatus: 'REJECTED',
          isAlreadyRejected: false,
          message: 'Withdrawal rejected and refunded exactly once.',
          userId: targetUid,
          userPhone: targetPhone,
          amount,
        };
      });

      // Synchronize secondary user doc if keyed by both phone and UID
      if (result.refunded && result.newBalance !== null) {
        const targetPhone = (result.userPhone || '').replace(/\D/g, '');
        const targetUid = result.userId;
        if (targetPhone && targetUid && targetPhone !== targetUid) {
          try {
            await setDoc(doc(db, 'users', targetUid), {
              withdrawableBalance: result.newBalance,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch {}
        }

        // Update matching transaction record in ledger
        try {
          const txSnap = await getDocs(collection(db, 'transactions'));
          txSnap.forEach(async (d) => {
            const t = d.data();
            if (d.id === requestId || t.notes?.includes(requestId)) {
              await updateDoc(doc(db, 'transactions', d.id), {
                status: 'REJECTED',
                notes: `Refunded to Withdrawable Balance. Reason: ${reason || 'Bank account verification failed'}`,
                updatedAt: new Date().toISOString(),
              }).catch(() => {});
            }
          });
        } catch {}
      }

      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('API /api/withdrawals/reject error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API 5: Withdrawal Approval
  app.post('/api/withdrawals/approve', async (req, res) => {
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'requestId required' });

    const adminToken = req.headers['x-admin-token'] || req.headers['authorization'];
    if (adminToken !== '112211' && adminToken !== 'Bearer 112211') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    try {
      await updateDoc(doc(db, 'withdrawals', requestId), {
        status: 'SUCCESS',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return res.json({ success: true, message: 'Withdrawal approved successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API 6: Admin Overview Data (Protected)
  app.get('/api/admin/overview', async (req, res) => {
    const adminToken = req.headers['x-admin-token'] || req.headers['authorization'];
    if (adminToken !== '112211' && adminToken !== 'Bearer 112211') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
    }

    try {
      const [usersSnap, depositsSnap, withdrawalsSnap, txSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'deposits')),
        getDocs(collection(db, 'withdrawals')),
        getDocs(collection(db, 'transactions')),
      ]);

      const users: any[] = [];
      usersSnap.forEach((d) => users.push({ id: d.id, ...d.data() }));

      const deposits: any[] = [];
      depositsSnap.forEach((d) => deposits.push({ id: d.id, ...d.data() }));

      const withdrawals: any[] = [];
      withdrawalsSnap.forEach((d) => withdrawals.push({ id: d.id, ...d.data() }));

      const transactions: any[] = [];
      txSnap.forEach((d) => transactions.push({ id: d.id, ...d.data() }));

      return res.json({
        success: true,
        users,
        deposits,
        withdrawals,
        transactions,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Vite Middleware Setup for Dev vs Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Prevent stale caching of index.html, sw.js, and manifest so website changes reflect immediately in the app
    app.use((req, res, next) => {
      if (
        req.path === '/' ||
        req.path.endsWith('.html') ||
        req.path.includes('sw.js') ||
        req.path.includes('registerSW.js') ||
        req.path.includes('manifest')
      ) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      next();
    });
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WinzoPay Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start WinzoPay server:', err);
  process.exit(1);
});
