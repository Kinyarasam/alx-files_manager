#!/usr/bin/env node
import Queue from 'bull';
import sha1 from 'sha1';
import dbClient from '../utils/db';

const userQueue = new Queue(
  'userQueue',
  'redis://localhost:6379',
);

class UsersController {
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    /* Email validation */
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    /* Password validation */
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const users = dbClient.db.collection('users');

    users.findOne({ email }, (err, user) => {
      if (err) throw err;

      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      /* Hash password */
      const hashedPassword = sha1(password);

      const newUser = {
        email,
        password: hashedPassword,
      };

      users.insertOne(newUser, (err, result) => {
        if (err) throw err;

        userQueue.add({ userId: result.insertedId });
        return res.status(201).json({ id: result.insertedId, email });
      });

      // users
      //   .insertOne(newUser)
      //   .then((result) => {
      //     userQueue.add({ userId: result.insertedId });
      //     return res.status(201).json({
      //       id: result.insertedId, email,
      //     });
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //   });
    // }
    });
  }
}

module.exports = UsersController;
