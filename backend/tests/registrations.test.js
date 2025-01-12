const supertest = require('supertest');
const { createApp } = require('../src/app');

jest.mock('../src/db', () => require('./helpers/dbMock').dbMockFactory());

const db = require('../src/db');

const FULL_REG = {
    RegistrationID: 1,
    StudentID: 1,
    CourseID: 1,
    LectureID: 1,
    LabID: null,
    Grade: null,
    RegistrationDate: '2025-09-01',
    StudentName: 'Alice',
    CourseName: 'Algorithms',
    LectureDay: 'Mon',
    LectureStartTime: '10:00',
    LectureEndTime: '11:30',
    LabDay: null,
    LabStartTime: null,
    LabEndTime: null,
};

describe('Registrations API', () => {
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

    // ── GET /api/registrations ───────────────────────────────────────────────
    describe('GET /api/registrations', () => {
        it('returns all registrations', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [FULL_REG] });

            const res = await supertest(app).get('/api/registrations');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].StudentName).toBe('Alice');
        });

        it('returns empty array when none exist', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).get('/api/registrations');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('DB error'));

            const res = await supertest(app).get('/api/registrations');

            expect(res.status).toBe(500);
        });
    });

    // ── GET /api/registrations/:id ────────────────────────────────────────────
    describe('GET /api/registrations/:id', () => {
        it('returns a single registration', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [FULL_REG] });

            const res = await supertest(app).get('/api/registrations/1');

            expect(res.status).toBe(200);
            expect(res.body.RegistrationID).toBe(1);
            expect(res.body.CourseName).toBe('Algorithms');
        });

        it('returns 404 when registration not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).get('/api/registrations/999');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Registration not found');
        });
    });

    // ── POST /api/registrations ───────────────────────────────────────────────
    describe('POST /api/registrations', () => {
        const payload = {
            StudentID: 1,
            CourseID: 1,
            LectureID: 1,
            LabID: null,
        };

        it('creates a registration and returns 201', async () => {
            // student check → course check → lecture check → no schedule conflict → no duplicate → INSERT → fetch complete
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ StudentID: 1 }] })            // student exists
                .mockResolvedValueOnce({ recordset: [{ CourseID: 1 }] })             // course exists
                .mockResolvedValueOnce({ recordset: [{ LectureID: 1 }] })            // lecture valid
                .mockResolvedValueOnce({ recordset: [] })                             // no schedule conflict
                .mockResolvedValueOnce({ recordset: [] })                             // no duplicate
                .mockResolvedValueOnce({ recordset: [{ RegistrationID: 10 }] })      // INSERT
                .mockResolvedValueOnce({ recordset: [{ ...FULL_REG, RegistrationID: 10 }] }); // fetch

            const res = await supertest(app).post('/api/registrations').send(payload);

            expect(res.status).toBe(201);
            expect(res.body.StudentName).toBe('Alice');
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 400 when student not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).post('/api/registrations').send(payload);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Student not found');
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        it('returns 400 when student is already registered for course', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ StudentID: 1 }] })   // student exists
                .mockResolvedValueOnce({ recordset: [{ CourseID: 1 }] })    // course exists
                .mockResolvedValueOnce({ recordset: [{ LectureID: 1 }] })   // lecture valid
                .mockResolvedValueOnce({ recordset: [] })                    // no schedule conflict
                .mockResolvedValueOnce({ recordset: [{ RegistrationID: 5 }] }); // DUPLICATE

            const res = await supertest(app).post('/api/registrations').send(payload);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already registered/i);
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        it('returns 400 on schedule conflict', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ StudentID: 1 }] })          // student
                .mockResolvedValueOnce({ recordset: [{ CourseID: 1 }] })           // course
                .mockResolvedValueOnce({ recordset: [{ LectureID: 1 }] })          // lecture valid
                .mockResolvedValueOnce({ recordset: [{ RegistrationID: 3 }] });    // CONFLICT

            const res = await supertest(app).post('/api/registrations').send(payload);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/conflict/i);
        });
    });

    // ── PUT /api/registrations/:id (grade update) ────────────────────────────
    describe('PUT /api/registrations/:id', () => {
        it('updates grade only and returns updated registration', async () => {
            const regRow = { RegistrationID: 1, StudentID: 1, CourseID: 1 };
            const updated = { ...FULL_REG, Grade: 'A+' };

            // existence check → UPDATE → pool.request fetch
            mockReq.query
                .mockResolvedValueOnce({ recordset: [regRow] })          // exists check
                .mockResolvedValueOnce({ recordset: [{ RegistrationID: 1 }] }) // UPDATE result
                .mockResolvedValueOnce({ recordset: [updated] });               // fetch complete

            const res = await supertest(app)
                .put('/api/registrations/1')
                .send({ Grade: 'A+' });

            expect(res.status).toBe(200);
            expect(res.body.Grade).toBe('A+');
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('rejects invalid grade format', async () => {
            const regRow = { RegistrationID: 1, StudentID: 1, CourseID: 1 };

            mockReq.query.mockResolvedValueOnce({ recordset: [regRow] }); // exists check

            const res = await supertest(app)
                .put('/api/registrations/1')
                .send({ Grade: 'Z' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/invalid grade/i);
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        it('returns 400 when registration not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app)
                .put('/api/registrations/999')
                .send({ Grade: 'B' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Registration not found');
        });

        it('accepts all valid grade formats', async () => {
            const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
            const regRow = { RegistrationID: 1, StudentID: 1, CourseID: 1 };

            for (const grade of validGrades) {
                jest.clearAllMocks();
                mockReq.query.mockReset();
                mockReq.input.mockReturnValue(mockReq);
                mockTx.begin.mockResolvedValue(undefined);
                mockTx.commit.mockResolvedValue(undefined);
                mockTx.rollback.mockResolvedValue(undefined);

                mockReq.query
                    .mockResolvedValueOnce({ recordset: [regRow] })
                    .mockResolvedValueOnce({ recordset: [{ RegistrationID: 1 }] })
                    .mockResolvedValueOnce({ recordset: [{ ...FULL_REG, Grade: grade }] });

                const res = await supertest(app)
                    .put('/api/registrations/1')
                    .send({ Grade: grade });

                expect(res.status).toBe(200);
            }
        });
    });

    // ── DELETE /api/registrations/:id ────────────────────────────────────────
    describe('DELETE /api/registrations/:id', () => {
        it('deletes a registration and returns success', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [{ RegistrationID: 1 }] });

            const res = await supertest(app).delete('/api/registrations/1');

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted successfully/i);
        });

        it('returns 404 when registration not found', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).delete('/api/registrations/999');

            expect(res.status).toBe(404);
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('db error'));

            const res = await supertest(app).delete('/api/registrations/1');

            expect(res.status).toBe(500);
        });
    });
});
