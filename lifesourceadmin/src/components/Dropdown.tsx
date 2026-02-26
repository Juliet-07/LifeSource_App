import React from "react";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
const token = localStorage.getItem("adminToken");

export const HospitalDropdown = ({ value, onChange }) => {
    const fetchHospitals = async () => {
        const res = await axios.get(`${apiURL}/admin/hospitals`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        console.log(res.data.data.hospitals);
        return res.data.data.hospitals;
    };

    const { data: hospitals = [], isLoading } = useQuery({
        queryKey: ["hospitals"],
        queryFn: fetchHospitals,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const options = hospitals.map((hospital) => ({
        label: hospital.institutionName,
        value: hospital._id,
    }));

    return (
        <div>
            <label className="block text-sm font-semibold text-deep-navy mb-2">
                Institution Name
            </label>
            <Select
                isLoading={isLoading}
                options={options}
                value={options.find((opt) => opt.value === value)}
                // onChange={(selectedOption) => onChange(selectedOption?.value)}
                onChange={(selectedOption) => {
                    onChange(selectedOption?.label, selectedOption?.value);
                }}
                placeholder="Select any institution (bloodbank or hospital)"
                className="react-select-container"
                classNamePrefix="react-select"
            />
        </div>
    );
};