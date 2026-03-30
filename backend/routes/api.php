<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SpaceController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ViewController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::apiResource('workspaces', WorkspaceController::class);
    Route::post('workspaces/{workspace}/spaces', [SpaceController::class, 'store']);

    Route::apiResource('spaces', SpaceController::class)->only(['show', 'update', 'destroy']);

    Route::post('spaces/{space}/tasks', [TaskController::class, 'store']);
    Route::patch('tasks/{task}', [TaskController::class, 'update']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

    Route::get('workspaces/{workspace}/views', [ViewController::class, 'workspaceData']);
});
