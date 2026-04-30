import 'dotenv/config';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../infrastructure/prisma';
import * as candidateRepository from '../infrastructure/repositories/candidateRepository';

const describeDb =
  process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

describeDb('POST /candidates integration', () => {
  const uniqueEmail = () =>
    `candidate-api-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  beforeEach(async () => {
    await prisma.candidate.deleteMany();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates candidate with required fields only', async () => {
    const email = uniqueEmail();

    const response = await request(app).post('/candidates').send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email,
    });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(email);

    const persisted = await prisma.candidate.findUnique({ where: { email } });
    expect(persisted).toBeTruthy();
  });

  it('creates candidate with nested relations', async () => {
    const email = uniqueEmail();

    const response = await request(app).post('/candidates').send({
      firstName: 'Grace',
      lastName: 'Hopper',
      email,
      educations: [
        {
          institution: 'Yale',
          title: 'PhD',
          startDate: '1930-01-01',
        },
      ],
      workExperiences: [
        {
          company: 'Navy',
          position: 'Commander',
          description: 'Research',
          startDate: '1943-01-01',
        },
      ],
      cv: {
        filePath: '/uploads/grace.pdf',
        fileType: 'application/pdf',
      },
    });

    expect(response.status).toBe(201);

    const persisted = await prisma.candidate.findUnique({
      where: { email },
      include: { educations: true, workExperiences: true, resumes: true },
    });

    expect(persisted?.educations).toHaveLength(1);
    expect(persisted?.workExperiences).toHaveLength(1);
    expect(persisted?.resumes).toHaveLength(1);
  });

  it('returns 400 for invalid email', async () => {
    const response = await request(app).post('/candidates').send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'invalid',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing required fields', async () => {
    const response = await request(app).post('/candidates').send({
      firstName: 'Ada',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 409 for duplicate email', async () => {
    const email = uniqueEmail();
    await prisma.candidate.create({
      data: { firstName: 'Ada', lastName: 'Lovelace', email },
    });

    const response = await request(app).post('/candidates').send({
      firstName: 'Grace',
      lastName: 'Hopper',
      email,
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('DUPLICATE_EMAIL');
  });

  it('returns sanitized 500 for unexpected failures', async () => {
    jest
      .spyOn(candidateRepository, 'createCandidateRecord')
      .mockRejectedValueOnce(new Error('unexpected low level failure'));

    const response = await request(app).post('/candidates').send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: uniqueEmail(),
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error',
      error: 'INTERNAL_SERVER_ERROR',
    });
  });
});
