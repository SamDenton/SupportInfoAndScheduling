<?php
header('Content-Type: application/json');

// Enable error reporting for debugging (remove or disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $operation = $data['operation'];
    $file_path = '../data/shifts.json';

    if (!file_exists($file_path)) {
        http_response_code(500);
        echo json_encode(['error' => 'Schedule JSON file not found.']);
        exit;
    }

    $schedule_data = json_decode(file_get_contents($file_path), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode(['error' => 'Error decoding JSON from file.']);
        exit;
    }

    switch ($operation) {
        case 'add':
            $weekIndex = intval($data['weekIndex']);
            if ($weekIndex < 0 || $weekIndex >= count($schedule_data)) {
                http_response_code(404);
                echo json_encode(['error' => 'Specified week index is out of range.']);
                exit;
            }

            $week = &$schedule_data[$weekIndex];
            $dayName = $data['weekDay'];
        
            if (isset($week['shifts'][$dayName])) {
                try {
                    $week['shifts'][$dayName]['Bookings'][] = [
                        'bookingId' => $data['bookingId'],
                        'startTime' => $data['startTime'],
                        'duration' => $data['duration'],
                        'assignedTo' => $data['assignedTo'],
                        'type' => $data['type'],
                        'customer' => $data['customer'],
                        'notes' => $data['notes']
                    ];
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error adding booking: ' . $e->getMessage()]);
                    exit;
                }
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Specified day not found within the week.']);
                exit;
            }
            break;     

        case 'remove':
            // Directly access the specified week and day
            $week = &$schedule_data[$data['weekIndex']];
            $day = &$week['shifts'][$data['weekDay']];
            $found = false;

            foreach ($day['Bookings'] as $key => $booking) {
                if ($booking['bookingId'] === $data['bookingId']) {
                    unset($day['Bookings'][$key]);  // Remove the booking
                    $day['Bookings'] = array_values($day['Bookings']); // Re-index array
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                http_response_code(404);
                echo json_encode(['error' => 'Booking not found.']);
                exit;
            }
            break;

        case 'editDay':
            $weekIndex = intval($data['weekIndex']);
            if ($weekIndex < 0 || $weekIndex >= count($schedule_data)) {
                http_response_code(404);
                echo json_encode(['error' => 'Specified week index is out of range.']);
                exit;
            }

            $week = &$schedule_data[$weekIndex];
            $dayName = $data['weekDay'];
            $type = $data['type'];
            $editedValue = $data['editedValue'];

            if (isset($week['shifts'][$dayName][$type])) {
                $week['shifts'][$dayName][$type] = $editedValue;
            } else {
                http_response_code(404);
                echo json_encode(['error' => "Specified day or type not found within the week."]);
                exit;
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid operation.']);
            exit;
    }

    if ($file = fopen($file_path, 'w')) {
        // Use json_encode with JSON_PRETTY_PRINT for formatted output
        $json_data = json_encode($schedule_data, JSON_PRETTY_PRINT);
        if ($json_data === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to encode JSON.']);
        } elseif (fwrite($file, $json_data) === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to write to JSON file.']);
        } else {
            fclose($file);
            echo json_encode(['success' => 'Operation completed successfully.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Unable to open JSON file for writing.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
}