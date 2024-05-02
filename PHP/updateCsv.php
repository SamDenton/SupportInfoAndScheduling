<?php
header('Content-Type: application/json'); // Set response type as JSON

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $operation = $data['operation'];
    $file_path = '../data/CustomerList.csv';
    // echo json_encode($data);
    // exit;
    if (!file_exists($file_path)) {
        http_response_code(500);
        echo json_encode(['error' => 'CSV file not found.']);
        exit;
    }
    
    $csv_data = array_map('str_getcsv', file($file_path));

    switch ($operation) {
        case 'edit':
            $rowIndex = $data['row'];
            $colIndex = $data['col'];
            $editedValue = $data['value'];
            if (isset($csv_data[$rowIndex]) && isset($csv_data[$rowIndex][$colIndex])) {
                $csv_data[$rowIndex][$colIndex] = $editedValue;
            }
            break;

        case 'add':
            $newRow = $data['newRow'];
            array_splice($csv_data, 1, 0, [$newRow]);
            break;

        case 'remove':
            $rowIndex = $data['row'];
            if (isset($csv_data[$rowIndex])) {
                unset($csv_data[$rowIndex]);
                $csv_data = array_values($csv_data);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid operation.']);
            exit;
    }

//     // Extract the header row
//     $header = array_shift($csv_data);

//    // Sort the remaining data, placing rows with blank first column at the top
//     usort($csv_data, function($a, $b) {
//         // If first column of both rows are blank, they are equal in terms of sorting
//         if ($a[0] === '' && $b[0] === '') {
//             return 0;
//         }
//         // If first column of $a is blank, it should come before $b
//         if ($a[0] === '') {
//             return -1;
//         }
//         // If first column of $b is blank, it should come before $a
//         if ($b[0] === '') {
//             return 1;
//         }
//         // Otherwise, sort alphabetically
//         return strcmp($a[0], $b[0]);
//     });

//     // Re-add the header at the beginning
//     array_unshift($csv_data, $header);

    // Write the sorted data back to the CSV file
    if ($file = fopen($file_path, 'w')) {
        foreach ($csv_data as $row) {
            fputcsv($file, $row);
        }
        fclose($file);
        echo json_encode(['success' => 'Operation completed successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error writing to CSV file.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
}
