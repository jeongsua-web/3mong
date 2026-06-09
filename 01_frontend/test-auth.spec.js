import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://43.201.25.12:8080/api/v1';

// ─────────────────────────────────────────────
// 로그인 테스트
// ─────────────────────────────────────────────
test.describe('로그인', () => {
  test('페이지 UI 요소 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await expect(page.locator('h1')).toContainText('Fluento');
    await expect(page.locator('h2')).toContainText('로그인');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required', '');
    await expect(page.locator('a:has-text("회원가입")')).toBeVisible();

    console.log('✅ 로그인 페이지 UI 요소 확인 통과');
  });

  test('비밀번호 보기/숨기기 토글', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill('mypassword');

    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.locator('button:has-text("보기")').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.locator('button:has-text("숨김")').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    console.log('✅ 비밀번호 토글 테스트 통과');
  });

  test('로그인 성공 → /home 이동 (API 모킹)', async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { accessToken: 'mock-token-12345' } }),
      });
    });

    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[name="email"]').fill('test@fluento.ai');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/home', { timeout: 7000 });
    expect(page.url()).toContain('/home');

    console.log('✅ 로그인 성공 테스트 통과');
  });

  test('로그인 실패 → 에러 메시지 표시 (API 모킹)', async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'INVALID_CREDENTIALS' } }),
      });
    });

    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[name="email"]').fill('wrong@fluento.ai');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    await expect(
      page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다')
    ).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/login');

    console.log('✅ 로그인 실패 에러 메시지 테스트 통과');
  });

  test('회원가입 링크 클릭 → /signup 이동', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('a:has-text("회원가입")').click();
    await page.waitForURL('**/signup', { timeout: 5000 });
    expect(page.url()).toContain('/signup');

    console.log('✅ 회원가입 링크 이동 테스트 통과');
  });
});

// ─────────────────────────────────────────────
// 회원가입 테스트
// ─────────────────────────────────────────────
test.describe('회원가입', () => {
  test('step1 폼 UI 요소 확인', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await expect(page.locator('h1')).toContainText('Fluento');
    await expect(page.locator('h2')).toContainText('회원가입');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('가입하기');
    await expect(page.locator('a:has-text("로그인")')).toBeVisible();

    console.log('✅ 회원가입 step1 UI 요소 확인 통과');
  });

  test('비밀번호 불일치 → 에러 메시지 표시 (API 호출 없음)', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.locator('input[name="username"]').fill('테스트사용자');
    await page.locator('input[name="email"]').fill('test@fluento.ai');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="confirmPassword"]').fill('differentPassword');
    await page.locator('button[type="submit"]').click();

    await expect(
      page.locator('text=비밀번호가 일치하지 않습니다')
    ).toBeVisible({ timeout: 3000 });
    expect(page.url()).toContain('/signup');

    console.log('✅ 비밀번호 불일치 에러 테스트 통과');
  });

  test('step1 제출 → step2(이메일 인증)로 전환 (API 모킹)', async ({ page }) => {
    await page.route(`${API_BASE}/auth/signup`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { message: 'OK' } }),
      });
    });

    await page.goto(`${BASE_URL}/signup`);
    await page.locator('input[name="username"]').fill('홍길동');
    await page.locator('input[name="email"]').fill('newuser@fluento.ai');
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('h2')).toContainText('이메일 인증', { timeout: 5000 });
    await expect(page.locator('input[placeholder="코드 6자리 입력"]')).toBeVisible();
    await expect(page.locator('text=newuser@fluento.ai')).toBeVisible();

    console.log('✅ 회원가입 step1→step2 전환 테스트 통과');
  });

  test('step2 인증 완료 → /login 이동 (API 모킹)', async ({ page }) => {
    await page.route(`${API_BASE}/auth/signup`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { message: 'OK' } }),
      });
    });
    await page.route(`${API_BASE}/auth/signup/confirm`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { message: 'OK' } }),
      });
    });

    await page.goto(`${BASE_URL}/signup`);

    // step1
    await page.locator('input[name="username"]').fill('홍길동');
    await page.locator('input[name="email"]').fill('newuser@fluento.ai');
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    // step2
    await expect(page.locator('h2')).toContainText('이메일 인증', { timeout: 5000 });

    page.on('dialog', dialog => dialog.accept());
    await page.locator('input[placeholder="코드 6자리 입력"]').fill('123456');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/login', { timeout: 7000 });
    expect(page.url()).toContain('/login');

    console.log('✅ 회원가입 인증 완료 → 로그인 이동 테스트 통과');
  });

  test('step2 인증 실패 → 에러 메시지 표시 (API 모킹)', async ({ page }) => {
    await page.route(`${API_BASE}/auth/signup`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { message: 'OK' } }),
      });
    });
    await page.route(`${API_BASE}/auth/signup/confirm`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'INVALID_CODE' } }),
      });
    });

    await page.goto(`${BASE_URL}/signup`);

    // step1
    await page.locator('input[name="username"]').fill('홍길동');
    await page.locator('input[name="email"]').fill('newuser@fluento.ai');
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    // step2
    await expect(page.locator('h2')).toContainText('이메일 인증', { timeout: 5000 });
    await page.locator('input[placeholder="코드 6자리 입력"]').fill('000000');
    await page.locator('button[type="submit"]').click();

    await expect(
      page.locator('text=인증 코드가 올바르지 않습니다')
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h2')).toContainText('이메일 인증');

    console.log('✅ 인증 코드 오류 에러 메시지 테스트 통과');
  });

  test('step2 돌아가기 → step1으로 복귀', async ({ page }) => {
    await page.route(`${API_BASE}/auth/signup`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { message: 'OK' } }),
      });
    });

    await page.goto(`${BASE_URL}/signup`);

    await page.locator('input[name="username"]').fill('홍길동');
    await page.locator('input[name="email"]').fill('newuser@fluento.ai');
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('h2')).toContainText('이메일 인증', { timeout: 5000 });
    await page.locator('button:has-text("돌아가기")').click();

    await expect(page.locator('h2')).toContainText('회원가입');
    await expect(page.locator('input[name="username"]')).toBeVisible();

    console.log('✅ 돌아가기 버튼 테스트 통과');
  });
});
