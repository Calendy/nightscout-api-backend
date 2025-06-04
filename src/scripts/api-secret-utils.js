#!/usr/bin/env node

const crypto = require('crypto');
const { sequelize } = require('../config/database');
const User = require('../models/User');

// Utility functions for API secret management
class ApiSecretUtils {
  
  // Generate a new API secret
  static generateApiSecret() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Hash an API secret
  static hashApiSecret(apiSecret) {
    return crypto.createHash('sha256').update(apiSecret).digest('hex');
  }
  
  // Verify if an API secret matches a hash
  static verifyApiSecret(apiSecret, hash) {
    const computedHash = this.hashApiSecret(apiSecret);
    return computedHash === hash;
  }
  
  // List all users and their API secrets
  static async listUsers() {
    try {
      const users = await User.findAll({
        attributes: ['id', 'email', 'api_secret', 'api_secret_hash', 'is_active'],
        where: { is_active: true }
      });
      
      console.log('\n📋 Active Users and API Secrets:');
      console.log('=====================================');
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   API Secret: ${user.api_secret}`);
        console.log(`   Hash: ${user.api_secret_hash}`);
        console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      });
      
      return users;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }
  
  // Find user by API secret
  static async findUserByApiSecret(apiSecret) {
    try {
      const hash = this.hashApiSecret(apiSecret);
      const user = await User.findOne({
        where: { api_secret_hash: hash, is_active: true }
      });
      
      if (user) {
        console.log(`\n✅ User found for API secret: ${apiSecret}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
      } else {
        console.log(`\n❌ No user found for API secret: ${apiSecret}`);
        console.log(`   Hash would be: ${hash}`);
      }
      
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }
  
  // Regenerate API secret for a user
  static async regenerateApiSecret(userEmail) {
    try {
      const user = await User.findOne({ where: { email: userEmail, is_active: true } });
      
      if (!user) {
        console.log(`❌ User not found: ${userEmail}`);
        return null;
      }
      
      const oldSecret = user.api_secret;
      const newSecret = this.generateApiSecret();
      
      user.api_secret = newSecret;
      user.api_secret_hash = this.hashApiSecret(newSecret);
      await user.save();
      
      console.log(`\n🔄 API Secret regenerated for: ${userEmail}`);
      console.log(`   Old Secret: ${oldSecret}`);
      console.log(`   New Secret: ${newSecret}`);
      console.log(`   New Hash: ${user.api_secret_hash}`);
      
      return user;
    } catch (error) {
      console.error('Error regenerating API secret:', error);
      throw error;
    }
  }
  
  // Test API secret authentication
  static async testApiSecret(apiSecret) {
    try {
      console.log(`\n🧪 Testing API secret: ${apiSecret}`);
      console.log(`   Length: ${apiSecret.length}`);
      console.log(`   Hash: ${this.hashApiSecret(apiSecret)}`);
      
      const user = await this.findUserByApiSecret(apiSecret);
      
      if (user) {
        console.log(`   ✅ Authentication would succeed`);
        console.log(`   User: ${user.email}`);
      } else {
        console.log(`   ❌ Authentication would fail`);
      }
      
      return !!user;
    } catch (error) {
      console.error('Error testing API secret:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    await sequelize.authenticate();
    console.log('🔗 Database connected successfully');
    
    switch (command) {
      case 'list':
        await ApiSecretUtils.listUsers();
        break;
        
      case 'test':
        if (!args[1]) {
          console.log('❌ Usage: node api-secret-utils.js test <api-secret>');
          process.exit(1);
        }
        await ApiSecretUtils.testApiSecret(args[1]);
        break;
        
      case 'find':
        if (!args[1]) {
          console.log('❌ Usage: node api-secret-utils.js find <api-secret>');
          process.exit(1);
        }
        await ApiSecretUtils.findUserByApiSecret(args[1]);
        break;
        
      case 'regenerate':
        if (!args[1]) {
          console.log('❌ Usage: node api-secret-utils.js regenerate <email>');
          process.exit(1);
        }
        await ApiSecretUtils.regenerateApiSecret(args[1]);
        break;
        
      case 'generate':
        const newSecret = ApiSecretUtils.generateApiSecret();
        console.log(`\n🔑 Generated new API secret: ${newSecret}`);
        console.log(`   Length: ${newSecret.length}`);
        console.log(`   Hash: ${ApiSecretUtils.hashApiSecret(newSecret)}`);
        break;
        
      default:
        console.log(`
🔑 API Secret Utilities
=======================

Usage: node api-secret-utils.js <command> [options]

Commands:
  list                    - List all active users and their API secrets
  test <api-secret>       - Test if an API secret would authenticate
  find <api-secret>       - Find user by API secret
  regenerate <email>      - Regenerate API secret for user
  generate                - Generate a new random API secret

Examples:
  node api-secret-utils.js list
  node api-secret-utils.js test 8309d05c9ec3c7460be6471ef71e7b06e018dd7a6530abd6265d29a43ca7397c
  node api-secret-utils.js regenerate user@example.com
        `);
        break;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Export for use as module
module.exports = ApiSecretUtils;

// Run CLI if called directly
if (require.main === module) {
  main();
}
