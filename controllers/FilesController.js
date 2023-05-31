#!/usr/bin/env node
import { ObjectID } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = await dbClient.db.collection('users');
    const idObject = new ObjectID(userId);
    users.findOne({ _id: idObject }, async (err, user) => {
      if (err) throw err;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { name } = req.body;
      const { type } = req.body;
      const { parentId } = req.body || 0;
      const { isPublic } = req.body || false;
      const { data } = req.body;
  
      if (!name) {
        return res.status(400).json({ error: 'Missing name'});
      }
  
      if (!type) {
        return res.status(400).json({ error: 'Missing type' }); // ccbbc6d9-f54e-4967-be8a-89db3f8bc302
      }
  
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }
      const files = await dbClient.db.collection('files');

      if (parentId) {
        const idObject = new ObjectID(parentId);

        await files.findOne({ _id: idObject }, (err, File) => {
          if (err) throw err;

          if (!File) {
            return res.status(400).json({ error: 'Parent not found' });
          }

          if (File.type !== 'folder') {
            return res.status(400).json({ error: 'Parent is not a folder' });
          }

          // File.
          res.send('On the right track');
        });
      } else {
        const filePath = path.join(process.env.FOLDER_PATH || '/tmp/files_manager/');
        const fileName = path.join(`${filePath}${uuidv4()}`);

        const jsonData = req.body;
        let data = jsonData.data;
        const buf = Buffer.from(data, 'base64');
        data = buf.toString('utf-8');

        try {
          try{ /* Create the filePath directory */
            fs.mkdir(filePath, (err) => {
              if (err) throw err;
              // console.log('Created');
            });
          } catch(err) {
            /* Raise some error */
          }
  
          /* Write to file in the directory `filePath` */
          fs.writeFile(fileName, data, (err) => {
            if (err) throw err;
            // console.log('saved');
          });
        } catch (err) {
          /* Raise some error */
        }
        
        const fileInfo = {
          userId: userId,
          name: name,
          type: type,
          isPublic: isPublic,
          parentId: parentId || 0,
          localPath: fileName,
        }

        files.insertOne(fileInfo, (err) => {
          if (err) throw err;

          res.status(201).json(fileInfo)
        })
      }
    });
  }
}

module.exports = FilesController;
