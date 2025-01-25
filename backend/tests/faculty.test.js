const supertest = require('supertest');
const { createApp } = require('../src/app');

jest.mock('../src/db', () => require('./helpers/dbMock').dbMockFactory());

const db = require('../src/db');

describe('Faculty API', () => {
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

    // ── GET /api/faculty ─────────────────────────────────────────────────────
    describe('GET /api/faculty', () => {
        it('returns all faculty members', async () => {
            const faculty = [
                { EmployeeID: 1, Name: 'Dr. Smith', Position: 'Professor', Salary: 90000 },
                { EmployeeID: 2, Name: 'Dr. Jones', Position: 'Lecturer', Salary: 65000 },
            ];
            mockReq.query.mockResolvedValueOnce({ recordset: faculty });

            const res = await supertest(app).get('/api/faculty');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].Position).toBe('Professor');
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('DB error'));

            const res = await supertest(app).get('/api/faculty');

            expect(res.status).toBe(500);
        });
    });

    // ── GET /api/faculty/:id ─────────────────────────────────────────────────
    describe('GET /api/faculty/:id', () => {
        it('returns a single faculty member', async () => {
            const member = { EmployeeID: 1, Name: 'Dr. Smith', Position: 'Professor' };
            mockReq.query.mockResolvedValueOnce({ recordset: [member] });

            const res = await supertest(app).get('/api/faculty/1');

            expect(res.status).toBe(200);
            expect(res.body.Name).toBe('Dr. Smith');
        });

        it('returns 404 when not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).get('/api/faculty/999');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Faculty member not found');
        });
    });

    // ── POST /api/faculty ────────────────────────────────────────────────────
    describe('POST /api/faculty', () => {
        const payload = {
            Name: 'Dr. Lee',
            Gender: 'Female',
            PhoneNumber: '555-9000',
            DepartmentID: 1,
            Position: 'Assistant Professor',
            Salary: 75000,
            HireDate: '2023-09-01',
        };

        it('creates a faculty member and returns 201', async () => {
            const created = { EmployeeID: 3, ...payload };
            mockReq.query.mockResolvedValueOnce({ recordset: [created] });

            const res = await supertest(app).post('/api/faculty').send(payload);

            expect(res.status).toBe(201);
            expect(res.body.EmployeeID).toBe(3);
            expect(res.body.Name).toBe('Dr. Lee');
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('insert error'));

            const res = await supertest(app).post('/api/faculty').send(payload);

            expect(res.status).toBe(500);
        });
    });

    // ── PUT /api/faculty/:id ─────────────────────────────────────────────────
    describe('PUT /api/faculty/:id', () => {
        const payload = { Name: 'Dr. Smith Updated', Position: 'Head of Department', Salary: 100000 };

        it('updates a faculty member and returns 200', async () => {
            const existing = { EmployeeID: 1, Name: 'Dr. Smith' };
            const updated = { EmployeeID: 1, Name: 'Dr. Smith Updated', Position: 'Head of Department' };

            mockReq.query
                .mockResolvedValueOnce({ recordset: [existing] }) // existence check
                .mockResolvedValueOnce({ recordset: [updated] });  // update result

            const res = await supertest(app).put('/api/faculty/1').send(payload);

            expect(res.status).toBe(200);
            expect(res.body.Position).toBe('Head of Department');
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 404 when not found', async () => {
            // route: res.status(getMessage(err).includes('not found') ? 404 : 400)
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).put('/api/faculty/999').send(payload);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Faculty member not found');
            expect(mockTx.rollback).toHaveBeenCalled();
        });
    });

    // ── DELETE /api/faculty/:id ──────────────────────────────────────────────
    describe('DELETE /api/faculty/:id', () => {
        it('deletes a faculty member without assignments', async () => {
            // existence check → count check (0,0) → delete
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ EmployeeID: 1 }] })           // exists
                .mockResolvedValueOnce({ recordset: [{ LectureCount: 0, LabCount: 0 }] }) // counts
                .mockResolvedValueOnce({ recordset: [] });                            // delete

            const res = await supertest(app).delete('/api/faculty/1');

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted successfully/i);
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 400 when faculty has teaching assignments (no force)', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ EmployeeID: 1 }] })                // exists
                .mockResolvedValueOnce({ recordset: [{ LectureCount: 2, LabCount: 0 }] }); // has lectures

            const res = await supertest(app).delete('/api/faculty/1');

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/teaching/i);
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        it('force-deletes faculty and their lectures/labs', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ EmployeeID: 1 }] })                // exists
                .mockResolvedValueOnce({ recordset: [{ LectureCount: 1, LabCount: 1 }] }) // counts
                .mockResolvedValueOnce({ recordset: [] })                                  // delete lectures
                .mockResolvedValueOnce({ recordset: [] })                                  // delete labs
                .mockResolvedValueOnce({ recordset: [] });                                 // delete employee

            const res = await supertest(app).delete('/api/faculty/1?force=true');

            expect(res.status).toBe(200);
            expect(res.body.hadDependencies).toBe(true);
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 400 when faculty member not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] }); // not found

            const res = await supertest(app).delete('/api/faculty/999');

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Faculty member not found');
            expect(mockTx.rollback).toHaveBeenCalled();
        });
    });
});
