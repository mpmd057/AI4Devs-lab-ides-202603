import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const describeDb =
    process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

describeDb('Candidate Prisma schema', () => {
    const uniqueEmail = () => `candidate-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await prisma.candidate.deleteMany();
    });

    it('creates a candidate with nested educations, workExperiences, and resumes', async () => {
        const email = uniqueEmail();
        const start = new Date('2020-01-01');
        const end = new Date('2021-06-01');

        const created = await prisma.candidate.create({
            data: {
                firstName: 'Ada',
                lastName: 'Lovelace',
                email,
                phone: '612345678',
                address: 'London',
                educations: {
                    create: [
                        {
                            institution: 'Uni A',
                            title: 'BSc CS',
                            startDate: start,
                            endDate: end,
                        },
                    ],
                },
                workExperiences: {
                    create: [
                        {
                            company: 'Co A',
                            position: 'Engineer',
                            description: 'Built systems',
                            startDate: start,
                            endDate: null,
                        },
                    ],
                },
                resumes: {
                    create: [
                        {
                            filePath: '/uploads/cv.pdf',
                            fileType: 'application/pdf',
                        },
                    ],
                },
            },
            include: {
                educations: true,
                workExperiences: true,
                resumes: true,
            },
        });

        expect(created.firstName).toBe('Ada');
        expect(created.lastName).toBe('Lovelace');
        expect(created.email).toBe(email);
        expect(created.educations).toHaveLength(1);
        expect(created.educations[0].institution).toBe('Uni A');
        expect(created.workExperiences).toHaveLength(1);
        expect(created.workExperiences[0].company).toBe('Co A');
        expect(created.resumes).toHaveLength(1);
        expect(created.resumes[0].filePath).toBe('/uploads/cv.pdf');
        expect(created.resumes[0].uploadDate).toBeInstanceOf(Date);
        expect(created.createdAt).toBeInstanceOf(Date);
        expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects duplicate email with P2002', async () => {
        const email = uniqueEmail();
        await prisma.candidate.create({
            data: {
                firstName: 'A',
                lastName: 'B',
                email,
            },
        });

        let error: unknown;
        try {
            await prisma.candidate.create({
                data: {
                    firstName: 'C',
                    lastName: 'D',
                    email,
                },
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
        expect((error as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });

    it('cascades delete from candidate to child rows', async () => {
        const email = uniqueEmail();
        const candidate = await prisma.candidate.create({
            data: {
                firstName: 'E',
                lastName: 'F',
                email,
                educations: {
                    create: {
                        institution: 'Uni B',
                        title: 'MSc',
                        startDate: new Date('2019-01-01'),
                    },
                },
                resumes: {
                    create: {
                        filePath: '/x.pdf',
                        fileType: 'application/pdf',
                    },
                },
            },
            include: { educations: true, resumes: true },
        });

        await prisma.candidate.delete({ where: { id: candidate.id } });

        const edu = await prisma.education.count({ where: { id: candidate.educations[0].id } });
        const res = await prisma.resume.count({ where: { id: candidate.resumes[0].id } });
        expect(edu).toBe(0);
        expect(res).toBe(0);
    });
});
