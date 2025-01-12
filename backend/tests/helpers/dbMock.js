/**
 * Shared helper to get the mock request & transaction from the mocked db module.
 * Call this inside beforeEach to get a fresh reference and reset mocks.
 *
 * Each test file must call jest.mock('../../src/db', dbMockFactory) at the top.
 */

function dbMockFactory() {
    const mockRequest = {
        input: jest.fn(),
        query: jest.fn(),
    };
    mockRequest.input.mockReturnValue(mockRequest);

    const mockTransaction = {
        begin: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
    };

    return {
        poolConnect: Promise.resolve(),
        pool: { request: jest.fn().mockReturnValue(mockRequest) },
        sql: {
            Int: 'int',
            VarChar: jest.fn().mockReturnValue('varchar'),
            NVarChar: jest.fn().mockReturnValue('nvarchar'),
            Date: 'date',
            Decimal: jest.fn().mockReturnValue('decimal'),
            Request: jest.fn().mockReturnValue(mockRequest),
            Transaction: jest.fn().mockReturnValue(mockTransaction),
        },
        _req: mockRequest,
        _tx: mockTransaction,
    };
}

module.exports = { dbMockFactory };
