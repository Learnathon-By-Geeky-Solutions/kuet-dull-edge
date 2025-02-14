import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose'
import { config } from '../../src/modules/config'
import * as request from 'supertest'
import { AuthModule } from '../../src/modules/auth/auth.module'

describe('AuthModule (e2e)', () => {
  let app: INestApplication
  //let anonymousUserJWT: string
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(config._.test_mongo_uri), AuthModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    const connection = app.get(getConnectionToken())
    await connection.dropDatabase()
    await app.close()

    await app.close()
  })

  describe('GET /auth', () => {
    it('should return an anonymous user JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth')
        .send({})
        .expect(200)

      expect(response.text).toBeDefined()
      expect(typeof response.text).toBe('string')
    })
  })
  describe('POST /auth/register', () => {
    it('should return an user JWT', async () => {
      const registerPayload = {
        username: 'testUser',
        email: 'test@example.com',
        password: 'Password1!',
        captchaToken: 'dummyCaptcha'
      }
      const authResponse = await request(app.getHttpServer())
        .get('/auth')
        .send({})
        .expect(200)

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${authResponse.text}`)
        .send(registerPayload)
        .expect(201)

      expect(registerResponse.text).toBeDefined()
      expect(typeof registerResponse.text).toBe('string')
    })
  })
})
