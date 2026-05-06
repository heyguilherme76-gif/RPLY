# Security Specification - RPLY

## Data Invariants
1. A user can only read and write their own profile in `/users/{userId}`.
2. A user can only read and write their own analyses in `/users/{userId}/analyses/{analysisId}`.
3. The `isPremium` field in `/users/{userId}` can ONLY be written by the system (or admin), not the user themselves (to prevent unauthorized upgrades).
4. `dailyUsage` is incremented by the user but should be constrained by the server logic (though client writes it here for simplicity in this demo, in production we'd use a cloud function).

## The Dirty Dozen Payloads (Targeted for PERMISSION_DENIED)

1. **Identity Spoofing**: Attempt to update `users/target-user-id` with `request.auth.uid = attacker-id`.
2. **Privilege Escalation**: Attempt to set `isPremium: true` on own profile.
3. **Ghost Field Injection**: Adding `systemSecret: "xyz"` to user profile.
4. **Data Overwrite**: Attempt to delete another user's profile.
5. **Collection Scraping**: Attempt to list all users.
6. **Path Poisoning**: Using a 2KB string as `analysisId`.
7. **Cross-User Read**: Reading `users/victim/analyses/analysis1` as attacker.
8. **Negative Usage**: Setting `dailyUsage: -100`.
9. **Email Spoofing**: Setting own email in profile to `admin@rply.com`.
10. **Orphaned Analysis**: Creating an analysis in a user path that doesn't match auth.uid.
11. **Future Timestamp**: Setting `createdAt` to 2099.
12. **Type Poisoning**: Sending `dailyUsage: "three"` instead of integer.

## Test Runner (Draft)

```typescript
// firestore.rules.test.ts
// (Simplified test logic)
test("user cannot update premium status", async () => {
  const db = authedDb({ uid: 'user1' });
  await assertFails(updateDoc(doc(db, 'users', 'user1'), { isPremium: true }));
});
```
