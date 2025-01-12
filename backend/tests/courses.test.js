const supertest = require('supertest');
const { createApp } = require('../src/app');

jest.mock('../src/db', () => require('./helpers/dbMock').dbMockFactory());

const db = require('../src/db');

describe('Courses API', () => {
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

    // ── GET /api/courses ─────────────────────────────────────────────────────
    describe('GET /api/courses', () => {
        it('returns all courses', async () => {
            const courses = [
                { CourseID: 1, Name: 'Intro to CS', CreditHours: 3, DepartmentID: 1 },
                { CourseID: 2, Name: 'Calculus', CreditHours: 4, DepartmentID: 2 },
            ];
            mockReq.query.mockResolvedValueOnce({ recordset: courses });

            const res = await supertest(app).get('/api/courses');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].Name).toBe('Intro to CS');
        });

        it('returns 500 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('DB error'));

            const res = await supertest(app).get('/api/courses');

            expect(res.status).toBe(500);
        });
    });

    // ── GET /api/courses/:id ─────────────────────────────────────────────────
    describe('GET /api/courses/:id', () => {
        it('returns a course with prerequisites', async () => {
            const rows = [
                { CourseID: 1, Name: 'Data Structures', CreditHours: 3, PrerequisiteID: 2, PrerequisiteName: 'Intro to CS' },
                { CourseID: 1, Name: 'Data Structures', CreditHours: 3, PrerequisiteID: null, PrerequisiteName: null },
            ];
            mockReq.query.mockResolvedValueOnce({ recordset: rows });

            const res = await supertest(app).get('/api/courses/1');

            expect(res.status).toBe(200);
            expect(res.body.CourseID).toBe(1);
            expect(Array.isArray(res.body.prerequisites)).toBe(true);
        });

        it('returns 404 when course does not exist', async () => {
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).get('/api/courses/999');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Course not found');
        });
    });

    // ── POST /api/courses ────────────────────────────────────────────────────
    describe('POST /api/courses', () => {
        const payload = {
            Name: 'Algorithms',
            CreditHours: 3,
            DepartmentID: 1,
            Prerequisites: [],
        };

        it('creates a course without prerequisites and returns 201', async () => {
            const created = { CourseID: 3, Name: 'Algorithms', CreditHours: 3, DepartmentID: 1 };
            // INSERT course → (no prereqs loop) → commit → res.status(201).json(newCourse)
            mockReq.query.mockResolvedValueOnce({ recordset: [created] });

            const res = await supertest(app).post('/api/courses').send(payload);

            expect(res.status).toBe(201);
            expect(res.body.Name).toBe('Algorithms');
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('creates a course with prerequisites', async () => {
            const payloadWithPrereqs = { ...payload, Prerequisites: [1, 2] };
            const created = { CourseID: 4, Name: 'Algorithms' };
            // course INSERT → prereq 1 INSERT → prereq 2 INSERT
            mockReq.query
                .mockResolvedValueOnce({ recordset: [created] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).post('/api/courses').send(payloadWithPrereqs);

            expect(res.status).toBe(201);
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 500 on db error (outer catch)', async () => {
            // route outer catch: res.status(500)
            mockReq.query.mockRejectedValueOnce(new Error('duplicate course'));

            const res = await supertest(app).post('/api/courses').send(payload);

            expect(res.status).toBe(500);
            expect(mockTx.rollback).toHaveBeenCalled();
        });
    });

    // ── PUT /api/courses/:id ─────────────────────────────────────────────────
    describe('PUT /api/courses/:id', () => {
        const payload = { Name: 'Advanced Algorithms', CreditHours: 4, DepartmentID: 1, Prerequisites: [] };

        it('updates a course (no prerequisites) and returns 200', async () => {
            const updated = { CourseID: 1, Name: 'Advanced Algorithms' };

            // UPDATE RETURNING * → (Prerequisites=[]) delete prereqs → commit
            mockReq.query
                .mockResolvedValueOnce({ recordset: [updated] }) // UPDATE returns row
                .mockResolvedValueOnce({ recordset: [] });        // DELETE prerequisites

            const res = await supertest(app).put('/api/courses/1').send(payload);

            expect(res.status).toBe(200);
            expect(res.body.Name).toBe('Advanced Algorithms');
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 404 when course not found (UPDATE returns empty)', async () => {
            // UPDATE returns empty recordset → explicit rollback + 404
            mockReq.query.mockResolvedValueOnce({ recordset: [] });

            const res = await supertest(app).put('/api/courses/999').send(payload);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Course not found');
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        it('returns 500 on unexpected db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('db error'));

            const res = await supertest(app).put('/api/courses/1').send(payload);

            expect(res.status).toBe(500);
        });
    });

    // ── DELETE /api/courses/:id ──────────────────────────────────────────────
    describe('DELETE /api/courses/:id', () => {
        it('deletes a course with no dependencies', async () => {
            // 1. counts (all 0) → 2. delete prereqs → 3. delete course RETURNING *
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ RegistrationCount: 0, PrerequisiteCount: 0, LectureCount: 0, LabCount: 0 }] })
                .mockResolvedValueOnce({ recordset: [] })                   // delete prereqs
                .mockResolvedValueOnce({ recordset: [{ CourseID: 1 }] });  // delete course

            const res = await supertest(app).delete('/api/courses/1');

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted successfully/i);
            expect(mockTx.commit).toHaveBeenCalled();
        });

        it('returns 400 when course has registrations or lectures', async () => {
            mockReq.query.mockResolvedValueOnce({
                recordset: [{ RegistrationCount: 3, PrerequisiteCount: 0, LectureCount: 1, LabCount: 0 }],
            });

            const res = await supertest(app).delete('/api/courses/1');

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/registrations/i);
        });

        it('returns 400 when course not found (DELETE returns empty)', async () => {
            mockReq.query
                .mockResolvedValueOnce({ recordset: [{ RegistrationCount: 0, PrerequisiteCount: 0, LectureCount: 0, LabCount: 0 }] })
                .mockResolvedValueOnce({ recordset: [] })   // delete prereqs
                .mockResolvedValueOnce({ recordset: [] });  // delete returns empty → 'Course not found'

            const res = await supertest(app).delete('/api/courses/999');

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Course not found');
        });

        it('returns 400 on db error', async () => {
            mockReq.query.mockRejectedValueOnce(new Error('fk constraint'));

            const res = await supertest(app).delete('/api/courses/1');

            expect(res.status).toBe(400);
        });
    });
});
