import { expect, test } from '@playwright/test'

// TODO Use fixtures for testing and not live db data

const testUser = {
  email: 'test@user.com',
  password: 'testuser',
}

test('has title', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle(/Conduit/)
})

test('displays banner', async ({ page }) => {
  await page.goto('./')

  const banner = page.getByTestId('banner-title')
  await expect(banner).toHaveText('conduit')
})

test('does not have personal feed without logged in user', async ({ page }) => {
  await page.goto('./')

  const globalFeed = page.getByTestId('feed-type-global')
  const personalFeed = page.getByTestId('feed-type-feed')

  await expect(globalFeed).toBeVisible()
  await expect(personalFeed).not.toBeVisible()
})

test('does have personal feed with logged in user', async ({ page }) => {
  await page.goto('./login')

  await page.getByTestId('input-email').fill(testUser.email)
  await page.getByTestId('input-password').fill(testUser.password)
  await page.getByTestId('btn-submit').click()

  const globalFeed = page.getByTestId('feed-type-global')
  const personalFeed = page.getByTestId('feed-type-feed')

  await expect(globalFeed).toBeVisible()
  await expect(personalFeed).toBeVisible()
})
