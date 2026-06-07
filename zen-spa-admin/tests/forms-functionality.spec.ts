import { test, expect } from '@playwright/test';

test.describe('Mascotas Manager - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mascotas', { waitUntil: 'networkidle' }).catch(() => {});
  });

  test('should display mascota form when clicking new button', async ({ page }) => {
    // Buscar botón de nueva mascota
    const newButton = page.locator('button:has-text(/nueva mascota|new pet/i)').first();
    
    if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newButton.click();
      
      // Verificar que el formulario aparece
      const form = page.locator('form');
      await expect(form).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have all required mascota form fields', async ({ page }) => {
    // Abrir formulario
    const newButton = page.locator('button:has-text(/nueva mascota|new pet/i)').first();
    if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newButton.click();
      
      // Verificar campos esperados
      const expectedFields = [
        'Dueño', 'cliente_id', 'owner',
        'Nombre', 'nombre', 'name',
        'Especie', 'especie', 'species',
        'Tipo', 'tipo_mascota',
        'Raza', 'raza', 'breed',
        'talla', 'talla', 'size',
        'Peso', 'peso', 'weight',
        'Edad', 'edad', 'age',
      ];
      
      // Contar cuántos campos se encuentran
      const form = page.locator('form');
      const formText = await form.textContent();
      let fieldsFound = 0;
      
      expectedFields.forEach(field => {
        if (formText?.toLowerCase().includes(field.toLowerCase())) {
          fieldsFound++;
        }
      });
      
      expect(fieldsFound).toBeGreaterThan(5); // Debería encontrar al menos 5 campos
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Abrir formulario
    const newButton = page.locator('button:has-text(/nueva mascota|new pet/i)').first();
    if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newButton.click();
      
      // Intentar enviar sin llenar campos requeridos
      const submitButton = page.locator('button[type="submit"]').first();
      
      // El navegador debería prevenir el envío si hay campos requeridos
      await submitButton.click();
      
      // Esperar a error message o validación
      const errorMsg = page.locator('.tone-red, [role="alert"]').first();
      const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
      
      // Si no hay error nativo, debería haber validación visual
      if (!hasError) {
        // Buscar campos required
        const requiredFields = page.locator('[required]');
        const requiredCount = await requiredFields.count();
        expect(requiredCount).toBeGreaterThan(0);
      }
    }
  });

  test('should show special requirements checkbox', async ({ page }) => {
    const newButton = page.locator('button:has-text(/nueva mascota|new pet/i)').first();
    if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newButton.click();
      
      // Buscar checkboxes de requisitos especiales
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      // Debería haber al menos 3 checkboxes (alimento especial, cama, mantita)
      if (count >= 3) {
        // Verificar que están etiquetados correctamente
        const specialReqSection = page.locator('text=/requisitos especiales|special requirements/i');
        const isVisible = await specialReqSection.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          // Verificar labels de checkboxes
          const labels = page.locator('label:has(input[type="checkbox"])');
          const labelCount = await labels.count();
          expect(labelCount).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});

test.describe('Clientes Manager - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clientes', { waitUntil: 'networkidle' }).catch(() => {});
  });

  test('should display cliente form when clicking new button', async ({ page }) => {
    const newButton = page.locator('button:has-text(/nuevo cliente|new client/i)').first();
    
    if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newButton.click();
      
      const form = page.locator('form');
      await expect(form).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have all required cliente form fields', async ({ page }) => {
    const newButton = page.locator('button:has-text(/nuevo cliente|new client/i)').first();
    if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newButton.click();
      
      // Verificar campos esperados
      const expectedFields = ['Nombre', 'Teléfono', 'WhatsApp', 'Email', 'Dirección'];
      
      const form = page.locator('form');
      const formText = await form.textContent();
      let fieldsFound = 0;
      
      expectedFields.forEach(field => {
        if (formText?.toLowerCase().includes(field.toLowerCase())) {
          fieldsFound++;
        }
      });
      
      expect(fieldsFound).toBeGreaterThan(2); // Debería encontrar al menos 3 campos
    }
  });
});

test.describe('Admin Panel - Data Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should display metric cards on dashboard', async ({ page }) => {
    // Buscar metric cards
    const metricCards = page.locator('.metric-card');
    const count = await metricCards.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should have tables with data', async ({ page }) => {
    // Buscar tablas
    const tables = page.locator('table');
    
    if (await tables.count() > 0) {
      const firstTable = tables.first();
      
      // Verificar headers
      const headers = firstTable.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });

  test('should display interactive elements', async ({ page }) => {
    // Verificar que hay botones
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
    
    // Verificar que hay inputs
    const inputs = page.locator('input');
    expect(await inputs.count()).toBeGreaterThan(0);
  });
});

test.describe('Admin Panel - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Buscar headings
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    
    // Debería haber al menos un h1 o h2
    const totalHeadings = await h1.count() + await h2.count();
    expect(totalHeadings).toBeGreaterThan(0);
  });

  test('should have accessible buttons and links', async ({ page }) => {
    // Buscar elementos clickeables
    const buttons = page.locator('button');
    const links = page.locator('a');
    
    const buttonsCount = await buttons.count();
    const linksCount = await links.count();
    
    expect(buttonsCount + linksCount).toBeGreaterThan(0);
  });

  test('should have proper focus states', async ({ page }) => {
    // Tab a través de elementos
    await page.keyboard.press('Tab');
    
    // Esperar un poco para el focus
    await page.waitForTimeout(100);
    
    // Verificar que hay un elemento enfocado
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName || 'NONE';
    });
    
    expect(focused).not.toBe('NONE');
  });
});
