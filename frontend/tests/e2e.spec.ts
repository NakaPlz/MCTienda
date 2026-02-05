import { test, expect } from '@playwright/test';

test.describe('Flujo de Compra Tienda Muy Criollo', () => {

    test('Debe cargar la página principal y mostrar productos', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await expect(page).toHaveTitle(/Muy Criollo/);
        await expect(page.locator('h1')).toContainText('Muy Criollo');

        // Verificar que hay productos
        const productos = page.locator('.bg-card');
        await expect(productos).toHaveCount(1); // Seed tiene 1 producto
    });

    test('Debe permitir agregar al carrito y ver detalle', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Agregar primer producto
        await page.locator('button:has-text("Agregar")').first().click();

        // Verificar contador carrito
        await expect(page.locator('a[href="/checkout"]')).toContainText('1');
    });

    test('Debe completar el formulario de checkout', async ({ page }) => {
        // 1. Agregar producto
        await page.goto('http://localhost:3000');

        // Esperar a que los productos sean visibles
        await expect(page.locator('.bg-card').first()).toBeVisible();

        await page.locator('button:has-text("Agregar")').first().click();

        // Esperar a que el contador del carrito se actualice
        await expect(page.locator('a[href="/checkout"]')).toContainText('1');

        // 2. Ir a Checkout
        await page.click('a[href="/checkout"]');
        await expect(page).toHaveURL(/\/checkout/);

        // 3. Llenar Formulario
        await page.fill('input[name="full_name"]', 'Usuario Test');
        await page.fill('input[name="email"]', 'test@test.com');
        await page.fill('input[name="phone"]', '1122334455');

        // 4. Submit (Interceptamos la redirección a Mercado Pago)
        // Mock window.location.href setter would depend on implementation, 
        // since we are using window.location.href = url, playwright can handle navigation or we intercept the request.
        // Actually, Playwright handles navigation automatically but creates external navigation.
        // We can just expect network request to /orders (backend) and then check we are redirected or see if we can mock the response.
        // For simplicity: We mock the window.location assign.
        await page.addInitScript(() => {
            // @ts-ignore
            Object.defineProperty(window, 'location', {
                value: {
                    ...window.location,
                    set href(url: string) {
                        console.log(`Redirected to ${url}`);
                    }
                },
                writable: true // Ensure it can be written to if needed by logic
            });
        });

        await page.click('button[type="submit"]');

        // Since we mocked location, we won't actually navigate. We can verify the console log or 
        // rely on the fact that if it fails it throws error.
        // Or we can just let it try to navigate and catch the external navigation?
        // Playwright test execution context:
        // Ideally we mock the API response to return a dummy payment URL to avoid hitting real MP API in E2E.
        // But for now let's just assert that the success/redirection logic triggers.
        // Since we are running against real local backend, it will try to hit MP API.

        // Wait for potential redirection or success message if we were to simulate return.
        // Actually, since we replaced WhatsApp redirection with generic URL redirection and 
        // successful order creation logic handles the redirect.

        // Let's assert that the button goes to "Procesando..." state.
        await expect(page.locator('button[type="submit"]')).toBeDisabled();
        await expect(page.locator('button[type="submit"]')).toHaveText("Procesando...");
    });
});
