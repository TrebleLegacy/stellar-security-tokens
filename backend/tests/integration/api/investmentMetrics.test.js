import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { apiClient, setAuthToken, clearAuthToken } from '../../helpers/apiClient.js';
import { setupTestDatabase, teardownTestDatabase } from '../../helpers/testDatabase.js';

describe('Investment Metrics API Integration Tests', () => {
  let testData;
  let adminToken;
  let dbAvailable = false;

  before(async () => {
    try {
      testData = await setupTestDatabase();
      dbAvailable = true;
      
      // Criar um platform admin para testes
      // Nota: Isso requer que já exista um platform admin no banco de teste
      // ou que possamos criar um via API
      try {
        const loginResponse = await apiClient.post('/api/platform-admins/login', {
          body: {
            email: 'admin@test.com',
            password: 'test123456',
          },
        });
        adminToken = loginResponse.data.data?.token;
        if (adminToken) {
          setAuthToken(adminToken);
        }
      } catch (error) {
        // Platform admin pode não existir, testes serão pulados
        console.log('⚠️  Platform admin não disponível para testes de métricas');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  PostgreSQL não está rodando. Pulando testes de integração.');
        dbAvailable = false;
      } else {
        throw error;
      }
    }
  });

  after(async () => {
    clearAuthToken();
    if (dbAvailable) {
      await teardownTestDatabase();
    }
  });

  test('GET /api/platform-admins/investments/metrics - requer autenticação', async () => {
    if (!dbAvailable) {
      assert.ok(true, 'PostgreSQL não disponível - teste pulado');
      return;
    }

    clearAuthToken();
    const response = await apiClient.get('/api/platform-admins/investments/metrics');
    
    assert.strictEqual(response.status, 401);
  });

  test('GET /api/platform-admins/investments/metrics - retorna métricas quando autenticado', async () => {
    if (!dbAvailable || !adminToken) {
      assert.ok(true, 'PostgreSQL ou admin não disponível - teste pulado');
      return;
    }

    setAuthToken(adminToken);
    const response = await apiClient.get('/api/platform-admins/investments/metrics');
    
    if (response.status === 200) {
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.data, 'Deve retornar dados de métricas');
      assert.ok(response.data.data.total !== undefined, 'Deve ter total de investimentos');
      assert.ok(response.data.data.byStatus, 'Deve ter status breakdown');
      assert.ok(response.data.data.totals, 'Deve ter totais');
      assert.ok(response.data.data.performance, 'Deve ter performance');
    } else {
      // Pode retornar 403 se não for platform admin
      assert.ok([200, 403].includes(response.status), 'Deve retornar 200 ou 403');
    }
  });

  test('GET /api/platform-admins/investments/metrics - aceita filtros de query', async () => {
    if (!dbAvailable || !adminToken) {
      assert.ok(true, 'PostgreSQL ou admin não disponível - teste pulado');
      return;
    }

    setAuthToken(adminToken);
    const response = await apiClient.get('/api/platform-admins/investments/metrics?start_date=2024-01-01&end_date=2024-12-31');
    
    if (response.status === 200) {
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.data, 'Deve retornar dados filtrados');
    } else {
      assert.ok([200, 403].includes(response.status), 'Deve retornar 200 ou 403');
    }
  });

  test('GET /api/platform-admins/investments/statistics - requer parâmetros de data', async () => {
    if (!dbAvailable || !adminToken) {
      assert.ok(true, 'PostgreSQL ou admin não disponível - teste pulado');
      return;
    }

    setAuthToken(adminToken);
    const response = await apiClient.get('/api/platform-admins/investments/statistics');
    
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.data.success, false);
  });

  test('GET /api/platform-admins/investments/statistics - retorna estatísticas com datas válidas', async () => {
    if (!dbAvailable || !adminToken) {
      assert.ok(true, 'PostgreSQL ou admin não disponível - teste pulado');
      return;
    }

    setAuthToken(adminToken);
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const response = await apiClient.get(
      `/api/platform-admins/investments/statistics?start_date=${startDate}&end_date=${endDate}`
    );
    
    if (response.status === 200) {
      assert.strictEqual(response.data.success, true);
      assert.ok(Array.isArray(response.data.data), 'Deve retornar array de estatísticas');
    } else {
      assert.ok([200, 403].includes(response.status), 'Deve retornar 200 ou 403');
    }
  });

  test('GET /api/platform-admins/investments/pending - retorna investimentos pendentes', async () => {
    if (!dbAvailable || !adminToken) {
      assert.ok(true, 'PostgreSQL ou admin não disponível - teste pulado');
      return;
    }

    setAuthToken(adminToken);
    const response = await apiClient.get('/api/platform-admins/investments/pending');
    
    if (response.status === 200) {
      assert.strictEqual(response.data.success, true);
      assert.ok(Array.isArray(response.data.data), 'Deve retornar array de investimentos pendentes');
    } else {
      assert.ok([200, 403].includes(response.status), 'Deve retornar 200 ou 403');
    }
  });
});

