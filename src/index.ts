import bcrypt from 'bcrypt'
import cors from 'cors'
import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { poolReader, poolWriter } from '../config/database.config'
const app = express()
app.use(express.json())
app.use(cors())
const port = process.env.PORT || 3000
const secret = 'mysecret'

app.post('/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const uuid: string = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const param = { email, password: hashedPassword, uuid }

    const rows: any = await poolReader.query('SELECT * FROM "C##test1".ACCOUNT WHERE USERNAME = :email', { email })
    if (rows[0]) {
        return res.status(400).send({ message: "Email is already registered" });
    }

    try {
        const result = await poolWriter.query(
            `
            INSERT INTO "C##test1".ACCOUNT (
                ID, 
                USERNAME,
                PASSWORD 
            )
            VALUES (
                :uuid,
                :email,
                :password
            )
            `,
            param
        );

        console.log('Successfully inserted user:', result);
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

app.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body
    const param = { email }
    try {
        const rows: any = await poolReader.query('SELECT * FROM "C##test1".ACCOUNT WHERE USERNAME = :email', param)
        const row = rows[0]
        const match = await bcrypt.compare(password, row[2])
        if (!match) {
            res.status(401).json({ message: 'login fail email or password incorrect.' })
        }

        const token = jwt.sign({ email, role: "admin" }, secret, { expiresIn: "1m" });

        console.log(token)

        res.status(200).json({
            token: token
        })

    } catch (error) {
        res.status(401).json({ message: 'login fail email or password incorrect.' })
    }
})

app.post('/welcome', async (req, res) => {
    const token = req.body.token
    try {
        const decoded = await jwt.verify(token, secret)

        res.status(200).json({ message: 'Successfully welcome to my website.' })
    } catch (error) {
        res.json({ message: 'you don\'t have permission to my website.' })
    }
})


app.listen(port, () => console.log('The server is running on http://localhost:' + port))
