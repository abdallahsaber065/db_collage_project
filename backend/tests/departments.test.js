const supertest = require('supertest');
const { createApp } = require('../src/app');

jest.mock('../src/db', () => require('./helpers/dbMock').dbMockFactory());

const db = require('../src/db');

describe('Departments API', () => {
    let app;
    let mockReq;
    let mockTx;

    beforeAll(() => {
        app = createApp();
    });

    beforeEach(() => {
        mockReq = db._req;
        mockTx = db._tx;
        jest.clearAllMocks();
        mockReq.query.mockReset();
        mockReq.input.mockReturnValue(mockReq);
        mockTx.begin.mockResolvedValue(undefined);
        mockTx.commit.mockResolvedValue(undefined);
        mockTx.rollback.mockResolvedValue(undefined);
    });

    // ── GET /api/departments ─────────────────────────────────────────────────
    describe('GET /api/departments', () => {
        it('returns all departments', async () => {
            const depts = [
                { DepartmentID: 1, Name: 'Computer Science', OfficeLocation: 'Block A' },
                { DepartmentID: 2, Name: 'Mathematics', OfficeLocation: 'Block B' },
            ];
            mockReq.query.mockResolvedValueOnce({ recordset: depts });

            const res = await supertest(app).get('/api/departments');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].Name).toBe('Computer Science');
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('connection failed'));

            const res = await supertest(app).get('/api/departments');

            expect(res.status).toBe(500);
        });
    });

    // ── GET /api/departments/:id ─────────────────────────────────────────────
    describe('GET /api/departments/:id', () => {
        it('returns a single department with counts', async () => {
            const dept = {
                DepartmentID: 1,
                Name: 'Computer Science',
                StudentCount: 50,
                FacultyCount: 10,
                CourseCount: 15,
            };
            mockReq.query.mockResolvedValueOnce({ recordset: [dept] });

            const res = await supertest(app).get('/api/departments/1');

            expect(res.status).toBe(200);
            expect(res.body.DepartmentID).toBe(1);
            expect(res.body).toHaveProperty('StudentCount');
        });

        it('returns 404 when department not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).get('/api/departments/999');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Department not found');
        });
    });

    // ── POST /api/departments ────────────────────────────────────────────────
    describe('POST /api/departments', () => {
        const payload = { Name: 'Physics', OfficeLocation: 'Block C' };

        it('creates a department and returns 201', async () => {
            const created = { DepartmentID: 3, ...payload };
            mockReq.query.mockResolvedValueOnce({ recordset: [created] });

            const res = await supertest(app).post('/api/departments').send(payload);

            expect(res.status).toBe(201);
            expect(res.body.DepartmentID).toBe(3);
            expect(res.body.Name).toBe('Physics');
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('duplicate key'));

            const res = await supertest(app).post('/api/departments').send(payload);

            expect(res.status).toBe(500);
        });
    });

    // ── PUT /api/departments/:id ─────────────────────────────────────────────
    describe('PUT /api/departments/:id', () => {
        const payload = { Name: 'CS Updated', OfficeLocation: 'Block Z' };

        it('updates a department and returns 200', async () => {
            // name differs from existing → triggers uniqueness check
            const existing = { DepartmentID: 1, Name: 'Computer Science' };
            const updated = { DepartmentID: 1, Name: 'CS Updated' };

            mockReq.query
                .mockResolvedValueOnce({ recordset: [existing] }) // existence check
                .mockResolvedValueOnce({ recordset: [] })         // name uniqueness — no duplicate
                .mockResolvedValueOnce({ recordset: [updated] }); // update

            const res = await supertest(app).put('/api/departments/1').send(payload);

            expect(res.status).toBe(200);
            expect(res.body.Name).toBe('CS Updated');
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 404 when department not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] }); // not found

            const res = await supertest(app).put('/api/departments/999').send(payload);

            // route: getMessage(err).includes('not found') ? 404 : 400
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Department not found');
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        it('returns 400 when a department with the same name already exists', async () => {
            const existing = { DepartmentID: 1, Name: 'Other Name' };
            mockReq.query
                .mockResolvedValueOnce({ recordset: [existing] })        // exists
                .mockResolvedValueOnce({ recordset: [{ DepartmentID: 2 }] }); // name conflict

            const res = await supertest(app).put('/api/departments/1').send(payload);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already exists/i);
        });
    });

    // ── DELETE /api/departments/:id ──────────────────────────────────────────
    describe('DELETE /api/departments/:id', () => {
        it('deletes a department with no dependencies', async () => {
            // all in transaction: exists? → count check → delete
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ DepartmentID: 1 }] })                               // exists
                .mockResolvedValueOnce({ recordset: [{ StudentCount: 0, FacultyCount: 0, CourseCount: 0 }] }) // no deps
                .mockResolvedValueOnce({ recordset: [] });                                                  // delete

            const res = await supertest(app).delete('/api/departments/1');

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted successfully/i);
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 400 when department has students/faculty/courses', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ DepartmentID: 1 }] })
                .mockResolvedValueOnce({ recordset: [{ StudentCount: 5, FacultyCount: 2, CourseCount: 3 }] });

            const res = await supertest(app).delete('/api/departments/1');

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/cannot delete/i);
        });

        it('returns 400 when department not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] }); // not found

            const res = await supertest(app).delete('/api/departments/999');

            // route uses res.status(400) for all errors
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Department not found');
        });

        it('returns 400 on unexpected db error', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ DepartmentID: 1 }] })
                .mockResolvedValueOnce({ recordset: [{ StudentCount: 0, FacultyCount: 0, CourseCount: 0 }] })
                .mockRejectedValueOnce(new Error('foreign key constraint'));

            const res = await supertest(app).delete('/api/departments/1');

            expect(res.status).toBe(400);
        });
    });
});
