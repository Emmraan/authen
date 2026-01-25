-- Sliding window rate limiter Lua script
-- KEYS[1] = key
-- ARGV[1] = now (ms)
-- ARGV[2] = windowMs
-- ARGV[3] = member (string)
-- ARGV[4] = limit (integer)
-- Returns: {allowed (0/1), count, earliestScore}

local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local member = ARGV[3]
local limit = tonumber(ARGV[4])
local windowStart = now - windowMs
local ttl = math.floor((windowMs + 999) / 1000)

redis.call('ZADD', key, now, member .. ':' .. now)
redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
local count = redis.call('ZCARD', key)
redis.call('EXPIRE', key, ttl)

if count > limit then
  local earliest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local earliestScore = earliest[2] or now
  return {0, tostring(count), tostring(earliestScore)}
end
local earliest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local earliestScore = earliest[2] or now
return {1, tostring(count), tostring(earliestScore)}
