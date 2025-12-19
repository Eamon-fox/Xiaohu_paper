# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WeChat Mini Program called "小狐Paper" - a paper/article reading application that fetches daily articles from a backend API and displays them with AI-generated summaries.

## Development Environment

- **Platform**: WeChat Mini Program (微信小程序)
- **IDE**: WeChat DevTools (微信开发者工具)
- **Language**: JavaScript (ES6 enabled)
- **AppID**: wx1a609eecc9dc6972

## Commands

There is no npm/build system. Development is done entirely through WeChat DevTools:
- Open the project folder in WeChat DevTools
- Use the built-in simulator for preview
- Click "Preview" or "Upload" in WeChat DevTools to deploy

## Architecture

### File Structure Convention
Each page follows the WeChat Mini Program convention with 4 files:
- `.js` - Page logic and data
- `.wxml` - Template (similar to HTML)
- `.wxss` - Styles (similar to CSS)
- `.json` - Page configuration

### Pages

**index** (`pages/index/`)
- Main page displaying daily article list
- Fetches from `GET /api/daily` returning `{ articles: [], date: string }`
- Articles have VIP highlighting (orange border + keyword tag)
- Supports pull-to-refresh

**detail** (`pages/detail/`)
- Article detail view
- Fetches from `GET /api/articles/{id}`
- Shows title, source, authors, AI summary
- "Copy link" button copies article URL to clipboard

### API Backend

All API calls go to `https://fanyiming.life/api/`:
- `GET /daily` - Returns daily article list with date
- `GET /articles/{id}` - Returns single article details

### Data Models

Article (from /daily):
```
{ id, source, score, title, summary, is_vip, vip_keywords[] }
```

Article (from /articles/{id}):
```
{ title, source, published_at, authors[], summary, link }
```

## Styling

- Primary color: `#2196f3` (blue)
- VIP accent: `#ff9800` (orange)
- Uses `rpx` units (responsive pixels for mini programs)
