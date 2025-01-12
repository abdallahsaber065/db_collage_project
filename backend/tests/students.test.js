const supertest = require('supertest');
const { createApp } = require('../src/app');

jest.mock('../src/db', () => require('./helpers/dbMock').dbMockFactory());

const db = require('../src/db');

describe('Students API', () => {
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

    // ── GET /api/students ────────────────────────────────────────────────────
    describe('GET /api/students', () => {
        it('returns a list of students', async () => {
            const students = [
                { StudentID: 1, Name: 'Alice', Gender: 'Female', CGPA: 3.8 },
                { StudentID: 2, Name: 'Bob', Gender: 'Male', CGPA: 3.2 },
            ];
            mockReq.query.mockResolvedValueOnce({ recordset: students });

            const res = await supertest(app).get('/api/students');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].Name).toBe('Alice');
        });

        it('returns empty array when no students exist', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).get('/api/students');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('DB down'));

            const res = await supertest(app).get('/api/students');

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('DB down');
        });
    });

    // ── GET /api/students/:id ────────────────────────────────────────────────
    describe('GET /api/students/:id', () => {
        it('returns a single student', async () => {
            const student = { StudentID: 1, Name: 'Alice', Gender: 'Female' };
            mockReq.query.mockResolvedValueOnce({ recordset: [student] });

            const res = await supertest(app).get('/api/students/1');

            expect(res.status).toBe(200);
            expect(res.body.Name).toBe('Alice');
        });

        it('returns 404 when student not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).get('/api/students/999');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Student not found');
        });
    });

    // ── POST /api/students ───────────────────────────────────────────────────
    describe('POST /api/students', () => {
        const payload = {
            Name: 'Charlie',
            Gender: 'Male',
            PhoneNumber: '555-1234',
            Major: 1,
            RecordedCreditHours: 60,
            CompletedCreditHours: 60,
            CGPA: 3.5,
        };

        it('creates a new student and returns 201', async () => {
            const created = { StudentID: 3, ...payload };
            mockReq.query.mockResolvedValueOnce({ recordset: [created] });

            const res = await supertest(app).post('/api/students').send(payload);

            expect(res.status).toBe(201);
            expect(res.body.StudentID).toBe(3);
            expect(res.body.Name).toBe('Charlie');
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('insert failed'));

            const res = await supertest(app).post('/api/students').send(payload);

            expect(res.status).toBe(500);
        });
    });

    // ── PUT /api/students/:id ────────────────────────────────────────────────
    describe('PUT /api/students/:id', () => {
        const payload = {
            Name: 'Alice Updated',
            Gender: 'Female',
            RecordedCreditHours: 90,
            CompletedCreditHours: 90,
            CGPA: 3.9,
        };

        it('updates a student and returns 200', async () => {
            const existing = { StudentID: 1, Name: 'Alice' };
            const updated = { StudentID: 1, Name: 'Alice Updated', CGPA: 3.9 };

            // studentCheck → deptCheck skipped (no Major) → update
            mockReq.query
                .mockResolvedValueOnce({ recordset: [existing] }) // existence check
                .mockResolvedValueOnce({ recordset: [updated] });  // update result

            const res = await supertest(app).put('/api/students/1').send(payload);

            expect(res.status).toBe(200);
            expect(res.body.Name).toBe('Alice Updated');
        });

        it('returns 404 when student not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] }); // not found check

            const res = await supertest(app).put('/api/students/999').send(payload);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Student not found');
            expect(mockTx.rollback).toHaveBeenCalled();
        });
    });

    // ── DELETE /api/students/:id ─────────────────────────────────────────────
    describe('DELETE /api/students/:id', () => {
        it('deletes a student without registrations', async () => {
            // 1. existence check, 2. count check (0), 3. delete
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ StudentID: 1 }] }) // exists
                .mockResolvedValueOnce({ recordset: [{ count: '0' }] })  // no registrations
                .mockResolvedValueOnce({ recordset: [] });               // delete

            const res = await supertest(app).delete('/api/students/1');

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted successfully/i);
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('deletes a student and their registrations when they exist', async () => {
            // 1. exists, 2. count (has 2), 3. delete registrations, 4. delete student
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ StudentID: 1 }] })
                .mockResolvedValueOnce({ recordset: [{ count: '2' }] })
                .mockResolvedValueOnce({ recordset: [] }) // delete registrations
                .mockResolvedValueOnce({ recordset: [] }); // delete student

            const res = await supertest(app).delete('/api/students/1');

            expect(res.status).toBe(200);
            expect(res.body.hadRegistrations).toBe(true);
        });

        it('returns 404 when student not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] }); // not found

            const res = await supertest(app).delete('/api/students/999');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Student not found');
        });

        it('returns 500 on db error during deletion', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ StudentID: 1 }] }) // exists
                .mockRejectedValueOnce(new Error('constraint violation')); // count check fails

            const res = await supertest(app).delete('/api/students/1');

            expect(res.status).toBe(500);
        });
    });
});
