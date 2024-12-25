import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Button, TextField, FormControl, InputLabel, Select, MenuItem, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import useContributionService from '../../../../services/contributionsServices';

const styles = {
    primaryOrange: "#DD730C",
    primaryGreen: "#4CAF50",
    primaryBlue: "#2196F3",
    lightGray: "#B0BEC5",
    offWhite: "#F5F5F5",
};
const GradingContribution = ({ open, onClose, contribution, onUpdate }) => {
    const [comments, setComments] = useState('');
    const [status, setStatus] = useState('');
    const [files, setFiles] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const contributionsService = useContributionService();
    const [hasFetchedData, setHasFetchedData] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const statusData = await contributionsService.getStatusOptions();
            setStatusOptions(statusData);
            setHasFetchedData(true);
        } catch (error) {
            console.error("Error fetching status options: ", error);
        }
    }, [contributionsService])

    useEffect(() => {
        if (!hasFetchedData) {
            fetchData();
        }
    }, [fetchData, hasFetchedData])

    useEffect(() => {
        if (contribution) {
            setComments(contribution.comments);
            setStatus(contribution.statusID?._id);
            setFiles(contribution.files.map(file => (
                new File([file.filePath], file.fileName, {
                    type: file.fileType,
                    lastModified: Date.now(),
                })
            )));
        }
    }, [contribution]);

    const handleSubmit = () => {
        const formData = new FormData();

        formData.append('comments', comments);
        formData.append('statusID', status);
        files.forEach(file => formData.append('files', file));
        onUpdate({ id: contribution._id, data: formData });
    };

    const handleClose = () => {
        setComments('');
        setStatus('');
        onClose();
    };

    return (
        <Dialog sx={{ borderRadius: 8 }} open={open} onClose={handleClose}>
            <DialogTitle sx={{ backgroundColor: styles.primaryOrange, color: styles.offWhite, mb: 1 }} align='center'>Update Contribution</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    fullWidth
                    label="Feedback"
                    multiline
                    rows={4}
                    variant="outlined"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                />
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Change Status</InputLabel>
                    <Select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        {statusOptions.map((statusOpt) => (
                            <MenuItem key={statusOpt._id} value={statusOpt._id}>
                                {statusOpt.statusName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button onClick={handleClose} variant="outlined" color="secondary">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">Update</Button>
                </DialogActions>
            </DialogContent>
        </Dialog >
    );
};

GradingContribution.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    contribution: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        comments: PropTypes.string.isRequired,
        statusID: PropTypes.object.isRequired,
        files: PropTypes.arrayOf(
            PropTypes.shape({
                fileName: PropTypes.string.isRequired,
                filePath: PropTypes.string,
                fileType: PropTypes.string,
            })
        )
    }),
    onUpdate: PropTypes.func.isRequired
};

export default GradingContribution;