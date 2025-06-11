const { ARMOR_DAMAGE_MODIFIERS, GAME_CONFIG } = require('./constants');

class CombatEngine {
  constructor(match) {
    this.match = match;
    this.combatInterval = null;
    this.tickRate = 100; // ms per tick
    this.collisionRadius = 0.3; // Grid units - increased collision for better spacing
  }

  startCombat() {
    if (this.combatInterval) {
      clearInterval(this.combatInterval);
    }

    this.combatInterval = setInterval(() => {
      this.combatTick();
    }, this.tickRate);
  }

  stopCombat() {
    if (this.combatInterval) {
      clearInterval(this.combatInterval);
      this.combatInterval = null;
    }
  }

  combatTick() {
    const allPlayerUnits = this.match.getAllPlayerUnits();
    const allEnemyUnits = this.match.enemyUnits;
    
    // Filter living units for game logic
    const alivePlayerUnits = allPlayerUnits.filter(u => u.status !== 'dead');
    const aliveEnemyUnits = allEnemyUnits.filter(u => u.status !== 'dead');
    
    // Filter units that are dying (marked as dead but still animating)
    const dyingPlayerUnits = allPlayerUnits.filter(u => u.status === 'dead' && !u.deathAnimationComplete);
    const dyingEnemyUnits = allEnemyUnits.filter(u => u.status === 'dead' && !u.deathAnimationComplete);

    // Check win conditions - wait for death animations to complete
    if (alivePlayerUnits.length === 0 && dyingPlayerUnits.length === 0) {
      this.stopCombat();
      this.match.endCombat('enemies');
      return;
    }

    if (aliveEnemyUnits.length === 0 && dyingEnemyUnits.length === 0) {
      this.stopCombat();
      this.match.endCombat('players');
      return;
    }

    // Update only living units
    [...alivePlayerUnits, ...aliveEnemyUnits].forEach(unit => {
      this.updateUnit(unit, alivePlayerUnits, aliveEnemyUnits);
    });

    // Broadcast combat state with ALL units (including dead) for client rendering
    // Filter out units without positions to prevent client-side errors
    const validPlayerUnits = allPlayerUnits.filter(unit => unit.position !== null);
    const validEnemyUnits = allEnemyUnits.filter(unit => unit.position !== null);
    
    this.match.io.to(this.match.matchId).emit('combat-update', validPlayerUnits, validEnemyUnits);
  }

  updateUnit(unit, playerUnits, enemyUnits) {
    // Skip if unit has no position or is dead
    if (!unit.position || unit.status === 'dead') return;

    // Determine if unit is player or enemy
    const isPlayerUnit = !unit.id.startsWith('enemy-');
    const friendlyUnits = isPlayerUnit ? playerUnits : enemyUnits;
    const hostileUnits = isPlayerUnit ? enemyUnits : playerUnits;

    // Update cooldowns
    if (unit.attackCooldown > 0) {
      unit.attackCooldown -= this.tickRate / 1000;
    }

    // Apply debuffs
    this.applyDebuffs(unit);

    // Re-target if unit has been blocked for too long
    if (unit.isBlocked && unit.stuckTimer) {
      unit.stuckTimer += this.tickRate;
      if (unit.stuckTimer > 2000) { // 2 seconds
        unit.targetId = null; // Force re-targeting
        unit.stuckTimer = 0;
      }
    } else if (unit.isBlocked) {
      unit.stuckTimer = this.tickRate;
    } else {
      unit.stuckTimer = 0;
    }

    // Special handling for priests - they heal instead of attack
    if (unit.name && unit.name.toLowerCase() === 'priest') {
      // Find injured friendly unit to heal
      let healTarget = this.findHealTarget(unit, friendlyUnits);
      
      if (healTarget && healTarget.position) {
        const distance = this.getDistance(unit.position, healTarget.position);

        if (distance <= unit.range) {
          // In range - heal
          unit.status = 'attacking'; // Use attack animation for healing
          unit.targetId = healTarget.id;

          if (unit.attackCooldown <= 0) {
            this.performHeal(unit, healTarget);
            unit.attackCooldown = 1 / unit.attackSpeed;
          }
        } else {
          // Move towards heal target
          unit.status = 'moving';
          unit.targetId = healTarget.id;
          this.moveTowards(unit, healTarget.position);
        }
      } else {
        // No one to heal - follow nearest ally
        const nearestAlly = this.findNearestAlly(unit, friendlyUnits);
        if (nearestAlly && nearestAlly.position) {
          unit.status = 'moving';
          unit.targetId = nearestAlly.id;
          this.moveTowards(unit, nearestAlly.position);
        } else {
          unit.status = 'idle';
          unit.targetId = null;
        }
      }
    } else {
      // Normal combat units - find enemies to attack
      let target = null;
      if (unit.targetId && !unit.isBlocked) {
        target = hostileUnits.find(u => u.id === unit.targetId);
      }
      
      if (!target || unit.stuckTimer > 1000) {
        target = this.findTarget(unit, hostileUnits);
      }

      if (target && target.position) {
        const distance = this.getDistance(unit.position, target.position);

        if (distance <= unit.range) {
          // In range - attack
          unit.status = 'attacking';
          unit.targetId = target.id;

          if (unit.attackCooldown <= 0) {
            this.performAttack(unit, target);
            unit.attackCooldown = 1 / unit.attackSpeed;
          }
        } else {
          // Move towards target
          unit.status = 'moving';
          unit.targetId = target.id;
          this.moveTowards(unit, target.position);
        }
      } else {
        // No target - move forward
        unit.status = 'moving';
        unit.targetId = null;
        
        if (isPlayerUnit) {
          // Player units move north towards enemies
          this.moveTowards(unit, { x: unit.position.x, y: 0 });
        } else {
          // Enemy units move south towards players
          this.moveTowards(unit, { x: unit.position.x, y: GAME_CONFIG.GRID_HEIGHT - 1 });
        }
      }
    } // End of normal combat units block

    // Apply healing passives (only for non-priest units)
    if (unit.name && unit.name.toLowerCase() !== 'priest') {
      this.applyHealing(unit, friendlyUnits);
    }
  }

  findTarget(unit, hostileUnits) {
    if (hostileUnits.length === 0) return null;

    // Find all units with lowest priority
    const lowestPriority = Math.min(...hostileUnits.map(u => u.priority));
    const priorityTargets = hostileUnits.filter(u => u.priority === lowestPriority);

    // Among priority targets, find closest
    let closestTarget = null;
    let closestDistance = Infinity;

    priorityTargets.forEach(target => {
      const distance = this.getDistance(unit.position, target.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    });

    return closestTarget;
  }

  getDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy) * 10; // Convert to pixels (approx)
  }

  moveTowards(unit, targetPos) {
    const dx = targetPos.x - unit.position.x;
    const dy = targetPos.y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Calculate movement for this tick (balanced for tactical combat)
    const moveDistance = (unit.movementSpeed * this.tickRate) / 1000 / 100; // Slowed by 10x for smooth tactical movement
    const moveRatio = Math.min(moveDistance / distance, 1);

    // Calculate new position
    const newX = unit.position.x + dx * moveRatio;
    const newY = unit.position.y + dy * moveRatio;
    
    // Check for collisions with other units
    const proposedPos = { x: newX, y: newY };
    const allUnits = [...this.match.getAllPlayerUnits(), ...this.match.enemyUnits]
      .filter(u => u.id !== unit.id && u.status !== 'dead' && u.position);
    
    // Check if proposed position collides with any other unit
    let hasCollision = false;
    let closestBlockingUnit = null;
    let closestBlockingDistance = Infinity;
    
    for (const otherUnit of allUnits) {
      const collisionDistance = this.getDistance(proposedPos, otherUnit.position) / 10; // Convert back to grid units
      if (collisionDistance < this.collisionRadius) {
        hasCollision = true;
        if (collisionDistance < closestBlockingDistance) {
          closestBlockingDistance = collisionDistance;
          closestBlockingUnit = otherUnit;
        }
      }
    }
    
    // Store movement direction for animation
    unit.movementDirection = { x: dx, y: dy };
    
    if (!hasCollision) {
      // Normal movement
      unit.position = {
        x: Math.max(0, Math.min(GAME_CONFIG.GRID_WIDTH - 1, newX)),
        y: Math.max(0, Math.min(GAME_CONFIG.GRID_HEIGHT - 1, newY))
      };
      unit.isBlocked = false;
    } else {
      // Try alternative path around blocking unit
      unit.isBlocked = true;
      const alternativePath = this.findAlternativePath(unit, targetPos, closestBlockingUnit);
      if (alternativePath) {
        unit.position = {
          x: Math.max(0, Math.min(GAME_CONFIG.GRID_WIDTH - 1, alternativePath.x)),
          y: Math.max(0, Math.min(GAME_CONFIG.GRID_HEIGHT - 1, alternativePath.y))
        };
        unit.movementDirection = { 
          x: alternativePath.x - unit.position.x, 
          y: alternativePath.y - unit.position.y 
        };
      }
    }
  }

  findAlternativePath(unit, targetPos, blockingUnit) {
    // Try moving around the blocking unit
    const moveDistance = (unit.movementSpeed * this.tickRate) / 1000 / 100;
    
    // Calculate perpendicular directions to try
    const dx = targetPos.x - unit.position.x;
    const dy = targetPos.y - unit.position.y;
    
    // Try moving perpendicular to the direct path
    const perpendicular1 = { x: -dy, y: dx };
    const perpendicular2 = { x: dy, y: -dx };
    
    // Normalize and scale the perpendicular vectors
    const normalize = (vec) => {
      const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
      return length > 0 ? { x: vec.x / length, y: vec.y / length } : { x: 0, y: 0 };
    };
    
    const dir1 = normalize(perpendicular1);
    const dir2 = normalize(perpendicular2);
    
    // Try both perpendicular directions
    const candidates = [
      {
        x: unit.position.x + dir1.x * moveDistance,
        y: unit.position.y + dir1.y * moveDistance
      },
      {
        x: unit.position.x + dir2.x * moveDistance,
        y: unit.position.y + dir2.y * moveDistance
      }
    ];
    
    // Check which candidate is valid and gets us closer to target
    const allUnits = [...this.match.getAllPlayerUnits(), ...this.match.enemyUnits]
      .filter(u => u.id !== unit.id && u.status !== 'dead' && u.position);
    
    for (const candidate of candidates) {
      // Check bounds
      if (candidate.x < 0 || candidate.x >= GAME_CONFIG.GRID_WIDTH || 
          candidate.y < 0 || candidate.y >= GAME_CONFIG.GRID_HEIGHT) {
        continue;
      }
      
      // Check collisions
      let hasCollision = false;
      for (const otherUnit of allUnits) {
        const collisionDistance = this.getDistance(candidate, otherUnit.position) / 10;
        if (collisionDistance < this.collisionRadius) {
          hasCollision = true;
          break;
        }
      }
      
      if (!hasCollision) {
        return candidate;
      }
    }
    
    return null; // No valid alternative path found
  }

  findHealTarget(healer, friendlyUnits) {
    // Find injured units (not at full health and not dead)
    const injuredUnits = friendlyUnits.filter(unit => 
      unit.id !== healer.id && 
      unit.status !== 'dead' && 
      unit.health < unit.maxHealth &&
      unit.position
    );
    
    if (injuredUnits.length === 0) return null;
    
    // Find the unit with the lowest health percentage
    let lowestHealthTarget = null;
    let lowestHealthPercentage = 1;
    
    injuredUnits.forEach(unit => {
      const healthPercentage = unit.health / unit.maxHealth;
      if (healthPercentage < lowestHealthPercentage) {
        lowestHealthPercentage = healthPercentage;
        lowestHealthTarget = unit;
      }
    });
    
    return lowestHealthTarget;
  }

  findNearestAlly(unit, friendlyUnits) {
    // Find the nearest living ally (excluding self)
    const allies = friendlyUnits.filter(ally => 
      ally.id !== unit.id && 
      ally.status !== 'dead' && 
      ally.position
    );
    
    if (allies.length === 0) return null;
    
    // Prioritize allies that are north (lower Y values) of the priest
    const alliesNorth = allies.filter(ally => ally.position.y < unit.position.y);
    const alliesToConsider = alliesNorth.length > 0 ? alliesNorth : allies;
    
    let nearestAlly = null;
    let nearestDistance = Infinity;
    
    alliesToConsider.forEach(ally => {
      const distance = this.getDistance(unit.position, ally.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAlly = ally;
      }
    });
    
    return nearestAlly;
  }

  performHeal(healer, target) {
    // Calculate heal amount (priests heal for a percentage of target's max health)
    const healAmount = Math.max(1, target.maxHealth * 0.0375); // 3.75% of max health (25% of 15%) or 1 HP minimum
    
    const oldHealth = target.health;
    target.health = Math.min(target.health + healAmount, target.maxHealth);
    
    const actualHeal = target.health - oldHealth;
    
    // Debug logging for heal verification
    console.log(`${healer.name} (${healer.id}) healed ${target.name} (${target.id}) for ${actualHeal.toFixed(1)} HP. Health: ${oldHealth.toFixed(1)} -> ${target.health.toFixed(1)}`);
    
    // Emit heal event for visual effect
    this.match.io.to(this.match.matchId).emit('unit-healed', {
      healerId: healer.id,
      targetId: target.id,
      healAmount: actualHeal
    });
  }

  performAttack(attacker, target) {
    // Calculate damage
    const armorMod = ARMOR_DAMAGE_MODIFIERS[target.armorType][attacker.attackType];
    let damage = attacker.damage * armorMod;

    // Special handling for wizard area attack
    if (attacker.name && attacker.name.toLowerCase() === 'wizard') {
      this.performWizardAreaAttack(attacker, target);
      return;
    }

    // Apply damage
    const oldHealth = target.health;
    target.health -= damage;
    
    // Debug logging for damage verification
    console.log(`${attacker.name} (${attacker.id}) attacked ${target.name} (${target.id}) for ${damage.toFixed(1)} damage. Health: ${oldHealth.toFixed(1)} -> ${target.health.toFixed(1)}`);

    // Check for death
    if (target.health <= 0) {
      target.health = 0;
      target.status = 'dead';
      target.deathAnimationComplete = false; // Track death animation state
      
      console.log(`${target.name} (${target.id}) has died!`);
      
      // Award gold bounty
      const bounty = Math.ceil(target.cost * GAME_CONFIG.KILL_BOUNTY_RATE);
      this.match.players.forEach(player => {
        player.gold += bounty;
      });

      // Apply death effects
      this.applyDeathEffects(target);
      
      // Set a timer to mark death animation as complete (2 seconds for animation + fade)
      setTimeout(() => {
        target.deathAnimationComplete = true;
      }, 2000);
    }

    // Apply on-hit effects
    this.applyOnHitEffects(attacker, target, damage);
  }

  performWizardAreaAttack(attacker, target) {
    // Calculate base damage
    const armorMod = ARMOR_DAMAGE_MODIFIERS[target.armorType][attacker.attackType];
    let baseDamage = attacker.damage * armorMod;

    // Debug logging for wizard attack
    console.log(`🔮 ${attacker.name} (${attacker.id}) casting area spell targeting ${target.name} (${target.id})`);

    // Emit wizard attack event for visual effects
    this.match.io.to(this.match.matchId).emit('wizard-attack', {
      attackerId: attacker.id,
      targetId: target.id
    });

    // Find all enemies within range of the target
    const allEnemyUnits = attacker.id.startsWith('enemy-') ? 
      this.match.getAllPlayerUnits() : 
      this.match.enemyUnits;
    
    const enemiesInRange = allEnemyUnits.filter(enemy => {
      if (enemy.status === 'dead' || !enemy.position || !target.position) return false;
      const distance = this.getDistance(enemy.position, target.position);
      return distance <= 30; // 30 pixel radius for area damage
    });

    console.log(`⚡ Wizard area attack affecting ${enemiesInRange.length} enemies`);

    // Apply damage to all enemies in range
    enemiesInRange.forEach(enemy => {
      const enemyArmorMod = ARMOR_DAMAGE_MODIFIERS[enemy.armorType][attacker.attackType];
      const damage = baseDamage * enemyArmorMod;
      
      const oldHealth = enemy.health;
      enemy.health -= damage;
      
      console.log(`💥 Wizard area damage: ${enemy.name} (${enemy.id}) took ${damage.toFixed(1)} damage. Health: ${oldHealth.toFixed(1)} -> ${enemy.health.toFixed(1)}`);

      // Check for death
      if (enemy.health <= 0) {
        enemy.health = 0;
        enemy.status = 'dead';
        enemy.deathAnimationComplete = false;
        
        console.log(`${enemy.name} (${enemy.id}) has died from wizard area attack!`);
        
        // Award gold bounty
        const bounty = Math.ceil(enemy.cost * GAME_CONFIG.KILL_BOUNTY_RATE);
        this.match.players.forEach(player => {
          player.gold += bounty;
        });

        // Apply death effects
        this.applyDeathEffects(enemy);
        
        // Set a timer to mark death animation as complete
        setTimeout(() => {
          enemy.deathAnimationComplete = true;
        }, 2000);
      }

      // Apply on-hit effects
      this.applyOnHitEffects(attacker, enemy, damage);
    });
  }

  applyOnHitEffects(attacker, target, damage) {
    attacker.buffs.forEach(buff => {
      switch (buff.type) {
        case 'lifesteal':
          attacker.health = Math.min(attacker.health + damage * buff.value, attacker.maxHealth);
          break;
        case 'poison':
          target.debuffs.push({
            id: `poison-${Date.now()}`,
            type: 'poison',
            value: buff.value,
            duration: 5
          });
          break;
      }
    });

    // Gladiator passive
    if (attacker.innatePassive && attacker.innatePassive.includes('extra gold')) {
      // Gold bonus is handled elsewhere
    }
  }

  applyDeathEffects(unit) {
    unit.buffs.forEach(buff => {
      switch (buff.type) {
        case 'deathHeal':
          // Heal nearby allies
          const healAmount = unit.maxHealth * buff.value;
          const allies = this.match.getAllPlayerUnits().filter(u => 
            u.id !== unit.id && 
            u.status !== 'dead' &&
            this.getDistance(unit.position, u.position) <= 50
          );
          allies.forEach(ally => {
            ally.health = Math.min(ally.health + healAmount, ally.maxHealth);
          });
          break;
        case 'deathExplosion':
          // Damage nearby enemies
          const damageAmount = unit.maxHealth * buff.value;
          const enemies = this.match.enemyUnits.filter(e =>
            e.status !== 'dead' &&
            this.getDistance(unit.position, e.position) <= 50
          );
          enemies.forEach(enemy => {
            enemy.health -= damageAmount;
            if (enemy.health <= 0) {
              enemy.health = 0;
              enemy.status = 'dead';
              enemy.deathAnimationComplete = false;
              // Set a timer to mark death animation as complete
              setTimeout(() => {
                enemy.deathAnimationComplete = true;
              }, 2000);
            }
          });
          break;
      }
    });
  }

  applyDebuffs(unit) {
    unit.debuffs = unit.debuffs.filter(debuff => {
      switch (debuff.type) {
        case 'poison':
          unit.health -= debuff.value * (this.tickRate / 1000);
          if (unit.health <= 0) {
            unit.health = 0;
            unit.status = 'dead';
            unit.deathAnimationComplete = false;
            // Set a timer to mark death animation as complete
            setTimeout(() => {
              unit.deathAnimationComplete = true;
            }, 2000);
          }
          break;
      }

      // Update duration
      if (debuff.duration !== undefined) {
        debuff.duration -= this.tickRate / 1000;
        return debuff.duration > 0;
      }
      return true;
    });
  }

  applyHealing(unit, friendlyUnits) {
    // Priest passive
    if (unit.innatePassive && unit.innatePassive.includes('Heals a nearby')) {
      const healTargets = friendlyUnits.filter(u =>
        u.id !== unit.id &&
        u.status !== 'dead' &&
        u.health < u.maxHealth &&
        this.getDistance(unit.position, u.position) <= 50
      );

      if (healTargets.length > 0) {
        const target = healTargets[0];
        let healAmount = 1 * (this.tickRate / 1000);
        
        // Bishop heals less frequently
        if (unit.name === 'Bishop') {
          healAmount = 0.5 * (this.tickRate / 1000);
        }

        // Knight passive
        if (target.innatePassive && target.innatePassive.includes('×2 effectiveness from heals')) {
          healAmount *= 2;
        }

        target.health = Math.min(target.health + healAmount, target.maxHealth);
      }
    }
  }
}

module.exports = CombatEngine;