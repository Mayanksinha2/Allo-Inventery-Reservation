# Allo Inventory Reservation Demo

This is a Next.js App Router application that implements inventory reservations for a multi-warehouse retail system.

## Project Description

A full-stack inventory reservation system for multi-warehouse retail brands. It supports concurrency-safe stock reservations, checkout expiry, reservation confirmation, cancellation, and real-time stock updates.

## Features

- Products and warehouses
- Stock levels per product per warehouse
- Available stock = total units - reserved units
- Pending reservations with expiry
- Confirm reservation after payment success
- Release reservation after payment failure or cancellation
- Automatic expiry cleanup
- Concurrency-safe reservation creation
- Visible 409 and 410 errors in the UI

## Tech Stack

- Next.js App Router
- TypeScript
- Prisma
- Neon PostgreSQL
- Tailwind CSS
- Zod

## Local Setup

Install dependencies:

```bash
npm install
